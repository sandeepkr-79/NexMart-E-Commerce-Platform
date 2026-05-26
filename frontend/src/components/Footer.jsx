import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Github, Twitter, MessageSquare } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer footer-center p-10 bg-slate-950 text-slate-400 border-t border-slate-900 font-sans">
      <aside className="grid-flow-col gap-4 items-center">
        <Link to="/" className="flex items-center gap-2 text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-500">
          <span className="p-1 bg-gradient-to-r from-violet-600 to-pink-600 rounded text-white">
            <ShoppingBag size={16} />
          </span>
          <span>NexMart</span>
        </Link>
        <p className="border-l border-slate-800 pl-4">Copyright © {new Date().getFullYear()} NexMart - All rights reserved</p>
      </aside> 
      <nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
        <Link to="/products" className="hover:text-violet-400 text-xs">Catalog</Link>
        <a href="#about" className="hover:text-violet-400 text-xs">About AI Assistant</a>
        <a href="#terms" className="hover:text-violet-400 text-xs">Terms</a>
      </nav>
      <div className="flex gap-4">
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-100 transition-colors">
          <Github size={18} />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-100 transition-colors">
          <Twitter size={18} />
        </a>
        <a href="#chat" className="hover:text-slate-100 transition-colors">
          <MessageSquare size={18} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
