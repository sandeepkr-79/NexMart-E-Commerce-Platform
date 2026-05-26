import React, { useState } from "react";
import {
  useCreateUserAdminMutation,
  useDeleteUserMutation,
  useGetAllUsersQuery,
  useUpdateUserAdminMutation,
} from "../../app/apiSlice.js";
import { CheckCircle, Edit3, Mail, Plus, Save, Trash2, Users2, X } from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "customer",
  sellerStatus: "none",
  isVerified: true,
};

const Users = () => {
  const { data, isLoading, isError } = useGetAllUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserAdminMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserAdminMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const users = data?.users || [];

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "customer",
      sellerStatus: user.sellerStatus || "none",
      isVerified: Boolean(user.isVerified),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { ...form };
    if (editingId && !payload.password) {
      delete payload.password;
    }

    if (editingId) {
      await updateUser({ id: editingId, data: payload }).unwrap();
    } else {
      await createUser(payload).unwrap();
    }
    resetForm();
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Delete ${user.email}? This will scrub personal user data.`)) {
      await deleteUser(user._id).unwrap();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">All Users</h2>
        <p className="text-xs text-slate-400">
          Create, update, and remove buyer, seller, and admin accounts.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 md:grid-cols-6"
      >
        <input className="input input-bordered input-sm bg-slate-950 md:col-span-1" placeholder="Name" value={form.name} onChange={(e) => setField("name", e.target.value)} required />
        <input className="input input-bordered input-sm bg-slate-950 md:col-span-2" placeholder="Email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
        <input className="input input-bordered input-sm bg-slate-950" placeholder={editingId ? "New password" : "Password"} type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} required={!editingId} />
        <select className="select select-bordered select-sm bg-slate-950" value={form.role} onChange={(e) => setField("role", e.target.value)}>
          <option value="customer">Customer</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm flex-1" type="submit" disabled={isCreating || isUpdating}>
            {editingId ? <Save size={15} /> : <Plus size={15} />}
            {editingId ? "Save" : "Add"}
          </button>
          {editingId && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={resetForm}>
              <X size={15} />
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300 md:col-span-2">
          <input className="checkbox checkbox-xs" type="checkbox" checked={form.isVerified} onChange={(e) => setField("isVerified", e.target.checked)} />
          Verified
        </label>
        <select className="select select-bordered select-sm bg-slate-950 md:col-span-2" value={form.sellerStatus} onChange={(e) => setField("sellerStatus", e.target.value)}>
          <option value="none">No seller status</option>
          <option value="pending">Pending seller</option>
          <option value="approved">Approved seller</option>
          <option value="suspended">Suspended</option>
        </select>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-slate-800 bg-slate-900"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-sm text-slate-400">Unable to load platform users. Please try again later.</p>
        </div>
      ) : users.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <Users2 size={36} className="mx-auto text-violet-400" />
          <p className="text-sm text-slate-400">No users have been registered yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <div key={user._id} className="grid grid-cols-1 gap-4 rounded-lg border border-slate-800 bg-slate-900 p-5 md:grid-cols-4">
              <div>
                <p className="text-sm font-bold text-slate-100">{user.name || user.email}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="text-sm text-slate-400">
                <p>{user.role || "customer"}</p>
                <p className="mt-2 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-400" /> {user.isVerified ? "Verified" : "Unverified"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail size={16} />
                <span className="text-xs">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(user)}>
                  <Edit3 size={15} />
                </button>
                <button className="btn btn-error btn-sm" type="button" onClick={() => handleDelete(user)} disabled={isDeleting}>
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

export default Users;
