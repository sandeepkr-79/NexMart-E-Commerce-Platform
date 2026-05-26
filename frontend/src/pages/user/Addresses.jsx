import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { MapPin, Plus, Trash2, Check, X } from 'lucide-react';
import { selectCurrentUser, setCredentials } from '../../app/authSlice.js';
import { useDispatch } from 'react-redux';
import { useAddAddressMutation, useDeleteAddressMutation, useSetDefaultAddressMutation, useGetUserProfileQuery } from '../../app/apiSlice.js';
import toast from 'react-hot-toast';

const Addresses = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ street: '', city: '', state: '', zipCode: '', country: 'India', isDefault: false });

  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefault] = useSetDefaultAddressMutation();
  const { refetch } = useGetUserProfileQuery();

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addAddress(form).unwrap();
      const res = await refetch().unwrap();
      dispatch(setCredentials({ user: res.user, accessToken: localStorage.getItem('token') }));
      toast.success('Address added');
      setShowForm(false);
      setForm({ street: '', city: '', state: '', zipCode: '', country: 'India', isDefault: false });
    } catch (err) { toast.error(err.data?.message || 'Failed to add'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id).unwrap();
      const res = await refetch().unwrap();
      dispatch(setCredentials({ user: res.user, accessToken: localStorage.getItem('token') }));
      toast.success('Address removed');
    } catch { toast.error('Delete failed'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefault(id).unwrap();
      const res = await refetch().unwrap();
      dispatch(setCredentials({ user: res.user, accessToken: localStorage.getItem('token') }));
      toast.success('Default address updated');
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">Saved Addresses</h2>
          <p className="text-xs text-slate-400 mt-1">Manage your delivery locations</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm bg-gradient-to-r from-violet-600 to-pink-600 border-none font-bold text-white gap-1.5">
          <Plus size={14}/> Add New
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-slate-900 border border-violet-500/20 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-violet-400">New Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.street} onChange={e => setForm({...form, street: e.target.value})} placeholder="Street / Locality *" required
              className="input input-bordered input-sm bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg sm:col-span-2 w-full"/>
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City *" required
              className="input input-bordered input-sm bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"/>
            <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State *" required
              className="input input-bordered input-sm bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"/>
            <input value={form.zipCode} onChange={e => setForm({...form, zipCode: e.target.value})} placeholder="PIN / Zip Code *" required
              className="input input-bordered input-sm bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"/>
            <input value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="Country"
              className="input input-bordered input-sm bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"/>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="checkbox checkbox-primary checkbox-sm"/>
            <span className="text-xs text-slate-300 font-medium">Set as default address</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={isAdding} className="btn btn-primary btn-sm font-bold">
              {isAdding ? <span className="loading loading-spinner"/> : 'Save Address'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm text-slate-400">
              <X size={14}/> Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {user?.addresses?.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            No addresses saved. Click "Add New" to add one.
          </div>
        )}
        {user?.addresses?.map(addr => (
          <div key={addr._id} className={`bg-slate-900 rounded-2xl border p-5 space-y-3 ${addr.isDefault ? 'border-violet-500/40' : 'border-slate-800'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-violet-400 shrink-0"/>
                {addr.isDefault && <span className="badge badge-primary badge-xs font-bold py-1.5 px-2">Default</span>}
              </div>
              <div className="flex gap-1">
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr._id)} title="Set as default"
                    className="btn btn-ghost btn-xs text-slate-500 hover:text-violet-400">
                    <Check size={13}/>
                  </button>
                )}
                <button onClick={() => handleDelete(addr._id)} className="btn btn-ghost btn-xs text-slate-500 hover:text-red-400">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
            <div className="text-xs font-medium text-slate-300 space-y-0.5">
              <p className="font-semibold text-slate-200">{addr.street}</p>
              <p>{addr.city}, {addr.state}</p>
              <p>{addr.zipCode} — {addr.country}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Addresses;
