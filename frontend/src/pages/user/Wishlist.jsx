import React from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";

const Wishlist = () => {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">
            Your Wishlist
          </h2>
          <p className="text-xs text-slate-400">
            Save items for later and revisit them when you're ready to purchase.
          </p>
        </div>
        <Link
          to="/products"
          className="btn btn-sm btn-outline text-slate-200 rounded-lg"
        >
          Browse Products
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
        <Heart size={40} className="mx-auto text-pink-400" />
        <h3 className="text-lg font-bold text-slate-100">
          Your wishlist looks empty
        </h3>
        <p className="text-sm text-slate-400">
          Add products to your wishlist so you can compare them later and keep
          track of special offers.
        </p>
        <Link
          to="/products"
          className="btn btn-primary btn-sm bg-gradient-to-r from-violet-600 to-pink-600 border-none"
        >
          Explore trending products
        </Link>
      </div>
    </div>
  );
};

export default Wishlist;
