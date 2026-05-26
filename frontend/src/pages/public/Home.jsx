import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Laptop, Headphones, Smartphone, Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import { useGetProductsQuery, useGetCategoriesQuery } from '../../app/apiSlice.js';
import RatingStars from '../../components/RatingStars.jsx';

const Home = () => {
  const { data: prodData, isLoading: prodsLoading } = useGetProductsQuery('limit=4&isFeatured=true');
  const { data: catData } = useGetCategoriesQuery();

  const mockCategories = [
    { name: 'Computers', icon: <Laptop size={20} />, slug: 'computers', color: 'bg-violet-600/10 text-violet-400 border-violet-500/20' },
    { name: 'Audio Devices', icon: <Headphones size={20} />, slug: 'audio', color: 'bg-pink-600/10 text-pink-400 border-pink-500/20' },
    { name: 'Wearables', icon: <Clock size={20} />, slug: 'wearables', color: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' }
  ];

  return (
    <div className="space-y-16 font-sans pb-12">
      {/* Hero Banner Section */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 p-6 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        {/* Animated ambient blob */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl opacity-30 -z-10 pointer-events-none"></div>

        <div className="flex-1 space-y-6">
          <div className="badge badge-primary gap-1.5 py-3 px-4 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
            <Sparkles size={12} /> Next-Gen E-Commerce
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-slate-100">
            Find the Perfect Deal with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500">
              RAG AI Chat
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-xl leading-relaxed">
            Welcome to NexMart, a multi-vendor marketplace featuring a floating AI assistant. Ask budgets, compare products side-by-side, or read technical product manuals instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link to="/products" className="btn btn-primary bg-gradient-to-r from-violet-600 to-pink-600 border-none px-6 rounded-xl font-bold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all flex items-center gap-2">
              Browse Store <ArrowRight size={16} />
            </Link>
            <a href="#about-ai" className="btn btn-outline border-slate-800 hover:bg-slate-900 rounded-xl px-6 font-semibold">
              Learn RAG Assistant
            </a>
          </div>
        </div>

        {/* Visual Mock Card Deck */}
        <div className="flex-1 max-w-md w-full relative">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-2xl relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></div>
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">NexMart AI Assistant</span>
            </div>
            
            <div className="chat chat-start text-xs">
              <div className="chat-bubble bg-slate-950 border border-slate-800 text-slate-300 rounded-xl rounded-tl-none p-3">
                Hello John! What device are you looking for today? Tell me your budget!
              </div>
            </div>

            <div className="chat chat-end text-xs">
              <div className="chat-bubble bg-violet-600 text-white rounded-xl rounded-tr-none p-3">
                Looking for noise cancelling headphones under ₹10,000.
              </div>
            </div>

            <div className="chat chat-start text-xs">
              <div className="chat-bubble bg-slate-950 border border-slate-800 text-slate-300 rounded-xl rounded-tl-none p-3 space-y-2">
                <p>Based on our inventory catalog:</p>
                <div className="bg-slate-900/60 p-2 border border-slate-800/80 rounded-lg flex gap-3 items-center">
                  <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80" alt="headphones" className="w-10 h-10 object-cover rounded" />
                  <div>
                    <p className="font-bold text-slate-200">SoundWave X1 ANC</p>
                    <p className="text-violet-400 font-semibold">₹4,999</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Backdrop card offsets */}
          <div className="absolute -top-3 -left-3 w-full h-full bg-slate-900/40 border border-slate-800 rounded-2xl -z-10 transform -rotate-2"></div>
        </div>
      </section>

      {/* Categories Row */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-100">Featured Categories</h2>
            <p className="text-xs text-slate-400 font-medium">Explore handpicked merchant catalogs</p>
          </div>
          <Link to="/products" className="text-xs font-semibold text-violet-400 hover:underline flex items-center gap-1.5">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {mockCategories.map((cat, idx) => (
            <Link
              key={idx}
              to={`/products?category=${cat.name}`}
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${cat.color}`}
            >
              <div className="p-3 bg-slate-950 rounded-xl">
                {cat.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-200">{cat.name}</h3>
                <p className="text-[10px] opacity-75 font-semibold uppercase tracking-wider">Explore Items</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products List */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-100">Trending Gadgets</h2>
          <p className="text-xs text-slate-400 font-medium">Top-selling items verified by NexMart administrators</p>
        </div>

        {prodsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-900 border border-slate-800 rounded-2xl h-80 w-full"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {prodData?.products?.map((p) => (
              <Link 
                to={`/product/${p._id}`}
                key={p._id} 
                className="card bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-violet-500/30 hover:scale-[1.01] transition-all group cursor-pointer"
              >
                <figure className="relative h-44 overflow-hidden bg-slate-950">
                  <img 
                    src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'} 
                    alt={p.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                      <span className="badge badge-error badge-sm font-bold uppercase tracking-wider py-2 px-3 rounded-full text-white">Out of Stock</span>
                    </div>
                  )}
                </figure>
                
                <div className="p-4 space-y-2">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500">{p.brand}</span>
                  <h3 className="font-bold text-sm text-slate-200 truncate group-hover:text-violet-400 transition-colors">{p.title}</h3>
                  <RatingStars rating={p.ratings} reviewCount={p.reviewCount} size={13} />
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-extrabold text-slate-100">₹{p.price.toLocaleString('en-IN')}</span>
                    {p.comparePrice > p.price && (
                      <span className="text-xs text-slate-500 line-through">₹{p.comparePrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* RAG Informational banner */}
      <section id="about-ai" className="card bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-12 items-center">
        <div className="flex-1 space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
            <Sparkles className="text-violet-400" /> Grounded AI (RAG Core)
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Unlike standard chatbots, NexMart AI utilizes **Retrieval-Augmented Generation (RAG)**. Administrators upload PDFs of product catalogs, technical manuals, and warranty details. The chatbot reads the local database and files to output factual, validated advice.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-400" size={16} /> Zero AI spec hallucinations
            </div>
            <div className="flex items-center gap-2.5">
              <HelpCircle className="text-violet-400" size={16} /> Suggestions for stock alternates
            </div>
          </div>
        </div>

        <div className="flex-1 shrink-0 p-6 bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-sm space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">RAG Knowledge Engine</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="font-medium text-slate-200">Aerobook_User_Manual.pdf</span>
              <span className="badge badge-success badge-xs">Indexed</span>
            </div>

            <div className="flex justify-between items-center text-xs p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="font-medium text-slate-200">Soundwave_Specification.pdf</span>
              <span className="badge badge-success badge-xs">Indexed</span>
            </div>

            <div className="flex justify-between items-center text-xs p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="font-medium text-slate-200">Warranty_FAQ_Document.pdf</span>
              <span className="badge badge-success badge-xs">Indexed</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
