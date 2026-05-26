import React, { useState } from "react";
import {
  useCreateSellerAdminMutation,
  useDeleteSellerAdminMutation,
  useGetSellerApplicationsQuery,
  useUpdateSellerAdminMutation,
} from "../../app/apiSlice.js";
import { DollarSign, Edit3, Plus, Save, Store, Trash2, X } from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  shopName: "",
  description: "",
  gstNumber: "",
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  accountHolderName: "",
  isVerified: true,
};

const Sellers = () => {
  const { data, isLoading, isError } = useGetSellerApplicationsQuery();
  const [createSeller, { isLoading: isCreating }] = useCreateSellerAdminMutation();
  const [updateSeller, { isLoading: isUpdating }] = useUpdateSellerAdminMutation();
  const [deleteSeller, { isLoading: isDeleting }] = useDeleteSellerAdminMutation();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const sellers = data?.sellers || [];

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (seller) => {
    setEditingId(seller._id);
    setForm({
      name: seller.user?.name || "",
      email: seller.user?.email || "",
      password: "",
      shopName: seller.shopName || "",
      description: seller.description || "",
      gstNumber: seller.gstNumber || "",
      accountNumber: seller.bankDetails?.accountNumber || "",
      ifscCode: seller.bankDetails?.ifscCode || "",
      bankName: seller.bankDetails?.bankName || "",
      accountHolderName: seller.bankDetails?.accountHolderName || "",
      isVerified: Boolean(seller.isVerified),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { ...form };
    if (editingId) {
      delete payload.password;
      await updateSeller({ id: editingId, data: payload }).unwrap();
    } else {
      await createSeller(payload).unwrap();
    }
    resetForm();
  };

  const handleDelete = async (seller) => {
    if (window.confirm(`Delete seller profile "${seller.shopName}"? Their products will be unapproved.`)) {
      await deleteSeller(seller._id).unwrap();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Marketplace Sellers</h2>
        <p className="text-xs text-slate-400">Create, edit, approve, and remove seller profiles.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 md:grid-cols-6">
        <input className="input input-bordered input-sm bg-slate-950" placeholder="Owner name" value={form.name} onChange={(e) => setField("name", e.target.value)} required />
        <input className="input input-bordered input-sm bg-slate-950 md:col-span-2" placeholder="Owner email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
        <input className="input input-bordered input-sm bg-slate-950" placeholder={editingId ? "Password unchanged" : "Password"} type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} required={!editingId} disabled={Boolean(editingId)} />
        <input className="input input-bordered input-sm bg-slate-950 md:col-span-2" placeholder="Shop name" value={form.shopName} onChange={(e) => setField("shopName", e.target.value)} required />
        <input className="input input-bordered input-sm bg-slate-950" placeholder="GST number" value={form.gstNumber} onChange={(e) => setField("gstNumber", e.target.value)} required />
        <input className="input input-bordered input-sm bg-slate-950" placeholder="Account number" value={form.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)} />
        <input className="input input-bordered input-sm bg-slate-950" placeholder="IFSC" value={form.ifscCode} onChange={(e) => setField("ifscCode", e.target.value)} />
        <input className="input input-bordered input-sm bg-slate-950" placeholder="Bank name" value={form.bankName} onChange={(e) => setField("bankName", e.target.value)} />
        <input className="input input-bordered input-sm bg-slate-950 md:col-span-2" placeholder="Account holder" value={form.accountHolderName} onChange={(e) => setField("accountHolderName", e.target.value)} />
        <textarea className="textarea textarea-bordered min-h-20 bg-slate-950 md:col-span-4" placeholder="Shop description" value={form.description} onChange={(e) => setField("description", e.target.value)} />
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input className="checkbox checkbox-xs" type="checkbox" checked={form.isVerified} onChange={(e) => setField("isVerified", e.target.checked)} />
          Verified seller
        </label>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" type="submit" disabled={isCreating || isUpdating}>
            {editingId ? <Save size={15} /> : <Plus size={15} />}
            {editingId ? "Save" : "Add"}
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
            <div key={i} className="h-22 animate-pulse rounded-lg border border-slate-800 bg-slate-900"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-sm text-slate-400">Unable to load seller list. Please refresh or try again later.</p>
        </div>
      ) : sellers.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <Store size={36} className="mx-auto text-violet-400" />
          <p className="text-sm text-slate-400">No seller applications found yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sellers.map((seller) => (
            <div key={seller._id} className="grid grid-cols-1 gap-4 rounded-lg border border-slate-800 bg-slate-900 p-5 md:grid-cols-4">
              <div>
                <p className="text-sm font-bold text-slate-100">{seller.shopName}</p>
                <p className="text-xs text-slate-500">{seller.user?.email || "No linked email"}</p>
              </div>
              <div className="text-sm text-slate-400">
                <p>{seller.user?.name || "Unknown owner"}</p>
                <p className="mt-2 flex items-center gap-2">
                  <DollarSign size={14} /> Revenue Rs. {(seller.totalRevenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center text-slate-400">
                <span className={`badge badge-sm ${seller.isVerified ? "badge-success" : "badge-warning"}`}>
                  {seller.isVerified ? "Approved" : "Pending"}
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(seller)}>
                  <Edit3 size={15} />
                </button>
                <button className="btn btn-error btn-sm" type="button" onClick={() => handleDelete(seller)} disabled={isDeleting}>
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

export default Sellers;
