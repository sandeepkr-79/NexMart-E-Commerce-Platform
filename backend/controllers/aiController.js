import { 
  queryRAG, 
  ingestPDF, 
  indexAllProducts, 
  generateAIDescription, 
  getAIPricingSuggestion, 
  generateAITags,
  localVectorStore
} from '../services/ai.service.js';
import Chat from '../models/Chat.js';

// User RAG chat assistant
export const handleAIChat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const sessId = sessionId || `session_${Math.random().toString(36).substring(2, 10)}`;
    const userId = req.user._id;

    const result = await queryRAG(message, userId, sessId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Admin upload PDF to RAG manual knowledge base
export const uploadPdfManual = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please send a PDF file.' });
    }

    await ingestPDF(req.file.buffer, req.file.originalname, { uploadedBy: req.user._id });
    res.status(200).json({ message: `PDF "${req.file.originalname}" successfully parsed, embedded and indexed into FAISS/MemoryVectorStore.` });
  } catch (error) {
    next(error);
  }
};

// Admin trigger re-index
export const triggerReindex = async (req, res, next) => {
  try {
    const status = await indexAllProducts();
    if (status) {
      return res.status(200).json({ message: 'AI Vector store product listings successfully re-indexed.' });
    }
    res.status(500).json({ message: 'Vector store re-indexing failed' });
  } catch (error) {
    next(error);
  }
};

// Seller AI Assist Description Generator
export const generateDescription = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    const description = await generateAIDescription(prompt);
    res.status(200).json({ description });
  } catch (error) {
    next(error);
  }
};

// Seller AI Pricing Assistant
export const suggestPricing = async (req, res, next) => {
  try {
    const { category, brand, basePrice } = req.query;
    if (!brand) {
      return res.status(400).json({ message: 'Brand name is required for competitive analysis.' });
    }
    const suggestion = await getAIPricingSuggestion(category, brand, basePrice);
    res.status(200).json(suggestion);
  } catch (error) {
    next(error);
  }
};

// Seller AI Tags Generator
export const suggestTags = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    const tags = await generateAITags(title, description);
    res.status(200).json({ tags });
  } catch (error) {
    next(error);
  }
};

// Admin AI cost and usage statistics
export const getAICostDashboard = async (req, res, next) => {
  try {
    // Collect all chats count
    const totalChats = await Chat.countDocuments();
    const allChats = await Chat.find().limit(50);
    let totalMessages = 0;
    allChats.forEach(c => totalMessages += c.messages.length);

    // Calculate mock metrics
    const totalQueries = Math.max(totalMessages, 128); // mock minimum if empty
    const avgResponseTimeMs = 850; // Milliseconds avg
    const estimatedCostUsd = totalQueries * 0.002; // $0.002 per GPT-4o query
    const totalTokensUsed = totalQueries * 450; // 450 avg tokens per query

    res.status(200).json({
      totalChats,
      totalQueries,
      avgResponseTimeMs,
      estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
      totalTokensUsed,
      vectorStoreItemsCount: localVectorStore.documents.length,
      topTopics: ['Laptops spec comparison', 'Smartwatch batteries', 'Return refund processes']
    });
  } catch (error) {
    next(error);
  }
};

// Get Session Chat Histories (User dashboard)
export const getMyChatHistory = async (req, res, next) => {
  try {
    const chats = await Chat.find({ user: req.user._id }).sort('-createdAt');
    res.status(200).json({ chats });
  } catch (error) {
    next(error);
  }
};
