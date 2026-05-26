import React, { useState } from "react";
import {
  useCreateProductAdminMutation,
  useDeleteProductAdminMutation,
  useGetAllProductsAdminQuery,
  useGetCategoriesQuery,
  useGetSellerApplicationsQuery,
  useUpdateProductAdminMutation,
} from "../../app/apiSlice.js";
import { Box, Edit3, Plus, Save, Tag, Trash2, X } from "lucide-react";

const emptyForm = {
  title: "",
  brand: "",
  price: "",
  comparePrice: "",
  stock: "",
  category: "",
  seller: "",
  description: "",
  tags: "",
  isApproved: true,
};

const Products = () => {
  const { data, isLoading, isError } = useGetAllProductsAdminQuery();
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: sellersData } = useGetSellerApplicationsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductAdminMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductAdminMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductAdminMutation();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const products = data?.products || [];
  const categories = categoriesData?.categories || [];
  const sellers = (sellersData?.sellers || []).filter((seller) => seller.user);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImages([]);
    setEditingId(null);
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      title: product.title || "",
      brand: product.brand || "",
      price: product.price ?? "",
      comparePrice: product.comparePrice ?? "",
      stock: product.stock ?? "",
      category: product.category?._id || product.category || "",
      seller: product.seller?._id || product.seller || "",
      description: product.description || "",
      tags: (product.tags || []).join(", "),
      isApproved: Boolean(product.isApproved),
    });
    setImages([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      payload.append(key, value);
    });
    images.forEach((file) => payload.append("images", file));

    if (editingId) {
      await updateProduct({ id: editingId, data: payload }).unwrap();
    } else {
      await createProduct(payload).unwrap();
    }
    resetForm();
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Delete product "${product.title}"?`)) {
      await deleteProduct(product._id).unwrap();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Platform Products</h2>
        <p className="text-xs text-slate-400">Create, edit, approve, and delete marketplace listings.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 md:grid-cols-6">
        <input className="input input-bordered input-sm bg-slate-950 md:col-span-2" placeholder="Title" value={form.title} onChange={(e) => setField("title", e.target.value)} required />
        <input className="input input-bordered input-sm bg-slate-950" placeholder="Brand" value={form.brand} onChange={(e) => setField("brand", e.target.value)} required />
        <input className="input input-bordered input-sm bg-slate-950" placeholder="Price" type="number" value={form.price} onChange={(e) => setField("price", e.target.value)} required />
        <input className="input input-bordered input-sm bg-slate-950" placeholder="Compare price" type="number" value={form.comparePrice} onChange={(e) => setField("comparePrice", e.target.value)} />
        <input className="input input-bordered input-sm bg-slate-950" placeholder="Stock" type="number" value={form.stock} onChange={(e) => setField("stock", e.target.value)} required />
        <select className="select select-bordered select-sm bg-slate-950 md:col-span-2" value={form.category} onChange={(e) => setField("category", e.target.value)} required>
          <option value="">Category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>{category.name}</option>
          ))}
        </select>
        <select className="select select-bordered select-sm bg-slate-950 md:col-span-2" value={form.seller} onChange={(e) => setField("seller", e.target.value)} required>
          <option value="">Seller</option>
          {sellers.map((seller) => (
            <option key={seller._id} value={seller.user._id}>{seller.shopName} - {seller.user.email}</option>
          ))}
        </select>
        <input className="input input-bordered input-sm bg-slate-950 md:col-span-2" placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setField("tags", e.target.value)} />
        <textarea className="textarea textarea-bordered min-h-20 bg-slate-950 md:col-span-3" placeholder="Description" value={form.description} onChange={(e) => setField("description", e.target.value)} required />
        <div className="md:col-span-3">
          <input
            className="file-input file-input-bordered file-input-sm w-full bg-slate-950"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setImages([...event.target.files])}
          />
          <p className="mt-2 text-xs text-slate-500">
            {editingId
              ? "Uploading new photos replaces the current product photos."
              : "Photos are uploaded to Cloudinary when the product is saved."}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input className="checkbox checkbox-xs" type="checkbox" checked={form.isApproved} onChange={(e) => setField("isApproved", e.target.checked)} />
          Approved
        </label>
        <div className="flex gap-2 md:col-span-2">
          <button className="btn btn-primary btn-sm" type="submit" disabled={isCreating || isUpdating}>
            {editingId ? <Save size={15} /> : <Plus size={15} />}
            {editingId ? "Save Product" : "Add Product"}
          </button>
          {editingId && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={resetForm}>
              <X size={15} />
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-slate-800 bg-slate-900"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-sm text-slate-400">Unable to load product catalog. Please check API connectivity.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <Box size={36} className="mx-auto text-violet-400" />
          <p className="text-sm text-slate-400">No products are available in the marketplace.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product._id} className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900 p-5 md:grid-cols-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{product.title}</h3>
                <p className="text-xs text-slate-500">{product.category?.name || "Uncategorized"}</p>
              </div>
              <div className="text-sm text-slate-400">
                <p>Rs. {product.price?.toLocaleString()}</p>
                <p>{product.stock} in stock</p>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Tag size={16} />
                <span className="text-xs">{product.seller?.name || "Unknown seller"}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className={`badge badge-sm ${product.isApproved ? "badge-success" : "badge-warning"}`}>
                  {product.isApproved ? "Approved" : "Pending"}
                </span>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(product)}>
                  <Edit3 size={15} />
                </button>
                <button className="btn btn-error btn-sm" type="button" onClick={() => handleDelete(product)} disabled={isDeleting}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
