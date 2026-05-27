import React from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import {
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
} from "../../app/apiSlice.js";
import toast from "react-hot-toast";

const Wishlist = () => {
  const { data } = useGetWishlistQuery();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const handleRemove = async (e, id) => {
    e.preventDefault();
    try {
      await removeFromWishlist(id).unwrap();
      toast.success("Removed from wishlist");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

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

      {data?.products && data.products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {data.products.map((p) => (
            <Link
              key={p._id}
              to={`/product/${p._id}`}
              className="card bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden"
            >
              <figure className="relative h-44 overflow-hidden bg-slate-950">
                <img
                  src={
                    p.images?.[0] ||
                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
                  }
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => handleRemove(e, p._id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/70 text-pink-400"
                >
                  {" "}
                  <Heart size={18} />{" "}
                </button>
              </figure>
              <div className="p-4 space-y-2">
                <span className="text-[10px] uppercase font-extrabold text-slate-500">
                  {p.brand}
                </span>
                <h3 className="font-bold text-sm text-slate-200 truncate">
                  {p.title}
                </h3>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-extrabold text-slate-100">
                    ₹{p.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default Wishlist;
