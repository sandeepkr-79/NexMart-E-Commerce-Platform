import React from "react";
import { Link } from "react-router-dom";
import {
  useGetSellerProductsQuery,
  useDeleteProductMutation,
} from "../../app/apiSlice.js";
import { ShoppingBag, PlusCircle, Trash2, Edit3 } from "lucide-react";

const SellerProducts = () => {
  const { data, isLoading, isError } = useGetSellerProductsQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const products = data?.products || [];

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;
    await deleteProduct(id).unwrap();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">My Products</h2>
          <p className="text-xs text-slate-400">
            View and manage listings in your store.
          </p>
        </div>
        <Link
          to="/seller/add-product"
          className="btn btn-primary btn-sm gap-2 bg-gradient-to-r from-violet-600 to-pink-600 border-none"
        >
          <PlusCircle size={16} /> Add Product
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-slate-900 border border-slate-800 rounded-3xl h-24"
            ></div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
          <p className="text-sm text-slate-400">
            Unable to load your products. Check backend connectivity.
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <ShoppingBag size={34} className="mx-auto text-violet-400" />
          <p className="text-sm text-slate-400">
            No products have been added yet.
          </p>
          <Link to="/seller/add-product" className="btn btn-primary btn-sm">
            Add first product
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-100">
                  {product.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {product.category?.name || "Uncategorized"} • ₹
                  {product.price?.toLocaleString()}
                </p>
                <p className="text-sm text-slate-400 mt-3 truncate">
                  {product.description || "No description available."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="btn btn-ghost btn-sm gap-2 text-slate-300 border border-slate-800 hover:text-violet-400">
                  <Edit3 size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="btn btn-ghost btn-sm gap-2 text-red-400 border border-red-500/20 hover:bg-red-500/10"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
