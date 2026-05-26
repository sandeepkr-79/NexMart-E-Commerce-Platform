import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");
import { config } from "dotenv";
import Product from "../models/Product.js";
import Chat from "../models/Chat.js";

config();

const VECTOR_STORE_PATH = fileURLToPath(
  new URL("../data/vectorStore.json", import.meta.url),
);
const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

const hasGroq = () => Boolean(process.env.GROQ_API_KEY);

const createGroqChatCompletion = async (messages, temperature = 0.3) => {
  if (!hasGroq()) {
    return "";
  }

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Groq request failed with ${response.status}: ${errorBody}`,
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

// Ensure data directory exists
const ensureDataDir = () => {
  const dir = path.dirname(VECTOR_STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// In-Memory Vector Store structure that persists to disk
class LocalVectorStore {
  constructor() {
    this.documents = [];
    this.load();
  }

  load() {
    ensureDataDir();
    if (fs.existsSync(VECTOR_STORE_PATH)) {
      try {
        const raw = fs.readFileSync(VECTOR_STORE_PATH, "utf-8");
        this.documents = JSON.parse(raw);
        console.log(
          `AI Service: Loaded ${this.documents.length} vector chunks from cache.`,
        );
      } catch (err) {
        console.error(
          "AI Service: Error reading vectorStore.json:",
          err.message,
        );
        this.documents = [];
      }
    } else {
      this.documents = [];
      this.save();
    }
  }

  save() {
    ensureDataDir();
    try {
      fs.writeFileSync(
        VECTOR_STORE_PATH,
        JSON.stringify(this.documents, null, 2),
        "utf-8",
      );
    } catch (err) {
      console.error("AI Service: Error saving vectorStore.json:", err.message);
    }
  }

  addDocument(id, text, metadata = {}, vector = null) {
    // Check if document with same ID already exists to avoid duplicates
    this.documents = this.documents.filter((doc) => doc.id !== id);
    this.documents.push({ id, text, metadata, vector });
    this.save();
  }

  // Simple cosine similarity helper
  similarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Fallback search when no embeddings are possible (keyword match)
  keywordSearch(query, limit = 5) {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    if (terms.length === 0) return this.documents.slice(0, limit);

    const matches = this.documents.map((doc) => {
      const content = (
        doc.text +
        " " +
        JSON.stringify(doc.metadata)
      ).toLowerCase();
      let score = 0;
      terms.forEach((term) => {
        if (content.includes(term)) {
          // Boost if term matches title or brand
          if (
            doc.metadata.title &&
            doc.metadata.title.toLowerCase().includes(term)
          )
            score += 3;
          else if (
            doc.metadata.brand &&
            doc.metadata.brand.toLowerCase().includes(term)
          )
            score += 2;
          else score += 1;
        }
      });
      return { doc, score };
    });

    return matches
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((m) => m.doc);
  }

  async search(query, limit = 5) {
    return this.keywordSearch(query, limit);
  }
}

export const localVectorStore = new LocalVectorStore();

// Core AI Chat Function
export const queryRAG = async (query, userId, sessionId) => {
  let chatResponse = "";
  let sources = [];

  // Retrieve relevant vector contexts
  const relevantDocs = await localVectorStore.search(query, 3);
  const vectorContext = relevantDocs
    .map((doc) => {
      let sourceStr = doc.metadata.source || "Product Manual";
      if (doc.metadata.title) sourceStr += ` - ${doc.metadata.title}`;
      if (!sources.includes(sourceStr)) sources.push(sourceStr);
      return `[Context from ${sourceStr}]: ${doc.text}`;
    })
    .join("\n\n");

  // Also query the live MongoDB for product information if relevant
  // Extract keywords
  const terms = query.split(/\s+/).filter((t) => t.length > 3);
  let dbProducts = [];
  if (terms.length > 0) {
    dbProducts = await Product.find({
      isApproved: true,
      $or: [
        { title: { $regex: terms.join("|"), $options: "i" } },
        { brand: { $regex: terms.join("|"), $options: "i" } },
        { tags: { $in: terms.map((t) => new RegExp(t, "i")) } },
      ],
    }).limit(5);
  } else {
    dbProducts = await Product.find({
      isApproved: true,
      stock: { $gt: 0 },
    }).limit(5);
  }

  const productContext = dbProducts
    .map(
      (p) =>
        `Product ID: ${p._id}\nTitle: ${p.title}\nBrand: ${p.brand}\nPrice: ₹${p.price}\nStock: ${p.stock}\nDescription: ${p.description}\nCategory ID: ${p.category}`,
    )
    .join("\n---\n");

  const systemPrompt = `You are NexMart AI, an intelligent shopping assistant for the NexMart marketplace.

Your responsibilities:
1. Recommend products within the user's stated budget using retrieved context.
2. Compare products honestly, listing pros and cons.
3. Always prioritize products available in the database (isApproved: true, stock > 0).
4. Suggest alternatives if a product is out of stock or unavailable.
5. Answer questions using uploaded manuals and FAQs when relevant.
6. Never hallucinate product names, prices, or specs.
7. Help sellers write optimized product descriptions on request.
8. Be concise, friendly, and always prioritize the user's best interest.
9. If unsure, say so — do not fabricate information.
10. For seller queries (pricing, SEO), use market context and retrieved data.

Always cite which products you are recommending with their IDs.`;

  const userContextPrompt = `Context from manual documents:\n${vectorContext || "No relevant manuals found."}\n\nContext from product catalog:\n${productContext || "No matching database products found."}\n\nUser Question: ${query}`;

  if (hasGroq()) {
    try {
      chatResponse = await createGroqChatCompletion(
        [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContextPrompt },
        ],
        0.3,
      );
    } catch (err) {
      console.error(
        "Groq generation error, falling back to simulation:",
        err.message,
      );
    }
  }

  // Fallback simulator if Groq fails or key is missing
  if (!chatResponse) {
    chatResponse = simulateChatbotResponse(query, dbProducts, relevantDocs);
  }

  // Save the conversation to database
  let chatRecord = await Chat.findOne({ user: userId, sessionId });
  if (!chatRecord) {
    chatRecord = new Chat({ user: userId, sessionId, messages: [] });
  }

  chatRecord.messages.push({ role: "user", content: query });
  chatRecord.messages.push({
    role: "assistant",
    content: chatResponse,
    sources,
  });
  await chatRecord.save();

  return { content: chatResponse, sources, sessionId };
};

// Simulated response engine based on rules
const simulateChatbotResponse = (query, products, docs) => {
  const queryLower = query.toLowerCase();

  // 1. Seller description tool triggered via chat
  if (
    queryLower.includes("write a description") ||
    queryLower.includes("create a description")
  ) {
    return `Here is an optimized SEO product description for your store:
    
"Experience high-performance innovation at its finest. Built using premium grade components, this product balances aesthetic sophistication with heavy-duty durability. Designed with cutting edge features to guarantee maximum utility and longevity. Includes multi-year warranty protection."`;
  }

  // 2. Budget query check
  const budgetMatch = queryLower.match(
    /(?:under|below|budget of)\s*(?:rs\.?|₹)?\s*([0-9,]+)/i,
  );
  if (budgetMatch) {
    const maxBudget = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
    const affordable = products.filter(
      (p) => p.price <= maxBudget && p.stock > 0,
    );
    if (affordable.length > 0) {
      let resp = `Based on your budget of ₹${maxBudget.toLocaleString("en-IN")}, I highly recommend these options available on NexMart:\n\n`;
      affordable.forEach((p) => {
        resp += `- **${p.title}** by ${p.brand} for **₹${p.price.toLocaleString("en-IN")}** (Stock: ${p.stock}) [Product ID: ${p._id}]\n  _${p.description.substring(0, 100)}..._\n\n`;
      });
      resp += `All items are in stock and ready to ship!`;
      return resp;
    } else {
      const cheapest = [...products].sort((a, b) => a.price - b.price)[0];
      let resp = `I could not find items under ₹${maxBudget.toLocaleString("en-IN")}. `;
      if (cheapest) {
        resp += `Our closest available option is **${cheapest.title}** by ${cheapest.brand} priced at **₹${cheapest.price.toLocaleString("en-IN")}** [ID: ${cheapest._id}]. `;
      }
      resp += `Would you like me to look for other alternatives?`;
      return resp;
    }
  }

  // 3. Comparison query check
  if (
    queryLower.includes("vs") ||
    queryLower.includes("compare") ||
    queryLower.includes("difference between")
  ) {
    if (products.length >= 2) {
      const p1 = products[0];
      const p2 = products[1];
      return `### Product Comparison: ${p1.title} vs ${p2.title}

Here is a side-by-side comparison of **${p1.title}** (₹${p1.price.toLocaleString()}) and **${p2.title}** (₹${p2.price.toLocaleString()}):

| Feature | ${p1.title} | ${p2.title} |
| :--- | :--- | :--- |
| **Brand** | ${p1.brand} | ${p2.brand} |
| **Price** | ₹${p1.price.toLocaleString()} | ₹${p2.price.toLocaleString()} |
| **Availability** | ${p1.stock > 0 ? "In Stock" : "Out of Stock"} | ${p2.stock > 0 ? "In Stock" : "Out of Stock"} |
| **Pros** | High quality, trusted | Sleek design, value |
| **Cons** | Higher price | Limited inventory |

**Recommendation:** If you prioritize premium features, go with **${p1.title}** [ID: ${p1._id}]. If you are looking for a better deal, choose **${p2.title}** [ID: ${p2._id}].`;
    }
    return `I see you want to compare products, but I couldn't find matching items in the catalog. Could you please specify which exact products you'd like to compare?`;
  }

  // 4. Manual / PDF contextual query check
  if (docs.length > 0) {
    const bestDoc = docs[0];
    return `According to the reference document **"${bestDoc.metadata.source || "Product Manual"}"**:\n\n"${bestDoc.text}"\n\nHope this resolves your query! Let me know if you need further details.`;
  }

  // 5. Out of stock alternate check
  const outOfStockItems = products.filter((p) => p.stock === 0);
  if (outOfStockItems.length > 0 && products.some((p) => p.stock > 0)) {
    const alternate = products.find((p) => p.stock > 0);
    return `The **${outOfStockItems[0].title}** is currently out of stock. As an alternative, I suggest looking at **${alternate.title}** by ${alternate.brand} (Price: ₹${alternate.price.toLocaleString()}) which is in stock [ID: ${alternate._id}].`;
  }

  // Default response
  if (products.length > 0) {
    let resp = `Hello! I am NexMart AI. Here are some featured products from our marketplace that might interest you:\n\n`;
    products.slice(0, 3).forEach((p) => {
      resp += `- **${p.title}** by ${p.brand} - **₹${p.price.toLocaleString("en-IN")}** (ID: ${p._id})\n`;
    });
    resp += `\nHow can I assist you with your shopping experience today?`;
    return resp;
  }

  return `Hello! I am NexMart AI, your shopping assistant. How can I help you navigate the marketplace today? (I can suggest products, search manuals, compare items, and help sellers set prices).`;
};

// Ingest PDF manually parsed to text chunks
export const ingestPDF = async (pdfBuffer, originalName, metadata = {}) => {
  try {
    const data = await pdf(pdfBuffer);
    const text = data.text;

    // Chunking text into ~1000 character segments
    const chunkSize = 1000;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    console.log(
      `Ingesting PDF: ${originalName}, extracted ${chunks.length} chunks.`,
    );

    chunks.forEach((chunk, index) => {
      const chunkId = `pdf_${originalName}_${index}`;
      const chunkMeta = {
        ...metadata,
        source: originalName,
        chunkIndex: index,
      };
      localVectorStore.addDocument(chunkId, chunk, chunkMeta);
    });

    return true;
  } catch (error) {
    console.error("PDF ingestion error:", error.message);
    throw new Error(`PDF parse failed: ${error.message}`);
  }
};

// Index a product item
export const indexProduct = async (product) => {
  const text = `${product.title} by ${product.brand}. ${product.description}. Price: ₹${product.price}. Tags: ${product.tags.join(", ")}.`;
  const metadata = {
    source: "product_db",
    productId: product._id.toString(),
    title: product.title,
    brand: product.brand,
    price: product.price,
  };

  localVectorStore.addDocument(
    `product_${product._id}`,
    text,
    metadata,
  );
};

// Re-index all approved products
export const indexAllProducts = async () => {
  try {
    const products = await Product.find({ isApproved: true });
    console.log(`Reindexing all ${products.length} approved products...`);
    for (const prod of products) {
      await indexProduct(prod);
    }
    return true;
  } catch (error) {
    console.error("Error during indexAllProducts:", error.message);
    return false;
  }
};

// --- Seller AI Tools ---

// 1. Generate SEO product descriptions
export const generateAIDescription = async (prompt) => {
  if (hasGroq()) {
    try {
      return await createGroqChatCompletion(
        [
          {
            role: "user",
            content: `Write an SEO-optimized product description for an e-commerce platform based on this short prompt: "${prompt}". Highlight benefits, use markdown, and make it engaging.`,
          },
        ],
        0.7,
      );
    } catch (error) {
      console.error("AI description error:", error.message);
    }
  }

  return `**Premium Design & High Performance**\n\nExperience top-tier results with this new release. Engineered using high-grade, resilient materials, it provides maximum efficiency and long-term utility. Key highlights include an ergonomic setup, modern aesthetics, and seamless integration.\n\n- **SEO Optimized Features:** Eco-friendly materials, compact style, durable build.\n- **Ideal for:** Work, lifestyle, and casual use.`;
};

// 2. AI Pricing Suggestions based on competition
export const getAIPricingSuggestion = async (categoryName, brand, price) => {
  const basePrice = Number(price) || 1000;
  // Look up competition in the DB under same category or brand
  let avgCompPrice = basePrice;
  try {
    const similar = await Product.find({ brand }).limit(10);
    if (similar.length > 0) {
      const total = similar.reduce((acc, curr) => acc + curr.price, 0);
      avgCompPrice = total / similar.length;
    }
  } catch (err) {
    console.error("Error querying pricing competition:", err.message);
  }

  // Suggest pricing: 5% discount, 10% premium, and competitive match
  const match = avgCompPrice;
  const discount = Math.round(avgCompPrice * 0.95);
  const premium = Math.round(avgCompPrice * 1.1);

  return {
    recommendedPrice: Math.round(match),
    marketAverage: Math.round(avgCompPrice),
    pricingStrategies: {
      budgetFriendly: discount,
      marketLeader: match,
      premiumBrand: premium,
    },
    reasoning: `Based on pricing analysis for ${brand} products in our marketplace (average catalog competitor price is ₹${Math.round(avgCompPrice).toLocaleString()}). Setting it at ₹${Math.round(match).toLocaleString()} aligns directly with current competition.`,
  };
};

// 3. Auto-generate tags/keywords
export const generateAITags = async (title, description) => {
  if (hasGroq()) {
    try {
      const response = await createGroqChatCompletion(
        [
          {
            role: "user",
            content: `Analyze this product title: "${title}" and description: "${description}". Output exactly 5 comma-separated keywords/tags suitable for product search tags. Do not output numbers or markdown, just the comma-separated terms.`,
          },
        ],
        0.2,
      );
      return response.split(",").map((tag) => tag.trim().toLowerCase());
    } catch (error) {
      console.error("AI tags error:", error.message);
    }
  }

  // Simple rule-based tags
  const keywords = [
    ...title.toLowerCase().split(/\s+/),
    ...description.toLowerCase().split(/\s+/),
  ];
  const uniqueKeywords = [...new Set(keywords)]
    .filter(
      (w) =>
        w.length > 4 &&
        !["about", "their", "there", "these", "under", "would"].includes(w),
    )
    .slice(0, 5);

  return uniqueKeywords.length > 0
    ? uniqueKeywords
    : ["featured", "premium", "gadget", "new-arrival", "deal"];
};

// 4. Sentiment analysis for seller reviews
export const getReviewSentiment = (reviews = []) => {
  if (reviews.length === 0) {
    return {
      status: "No Reviews",
      score: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
    };
  }

  let positive = 0;
  let negative = 0;
  let neutral = 0;
  let totalRating = 0;

  reviews.forEach((r) => {
    totalRating += r.rating;
    if (r.rating >= 4) positive++;
    else if (r.rating <= 2) negative++;
    else neutral++;
  });

  const avg = totalRating / reviews.length;
  let sentimentText = "Neutral";
  if (avg >= 3.8) sentimentText = "Highly Positive";
  else if (avg >= 3.2) sentimentText = "Positive";
  else if (avg <= 2.2) sentimentText = "Negative";

  return {
    sentiment: sentimentText,
    averageRating: Math.round(avg * 10) / 10,
    positiveCount: positive,
    negativeCount: negative,
    neutralCount: neutral,
    percentagePositive: Math.round((positive / reviews.length) * 100),
  };
};
