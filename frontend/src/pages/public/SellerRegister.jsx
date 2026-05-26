import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Store, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApplySellerMutation, useGetUserProfileQuery } from '../../app/apiSlice.js';
import { selectCurrentUser, setCredentials } from '../../app/authSlice.js';
import toast from 'react-hot-toast';

const SellerRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  
  // Bank details
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  // Files
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);

  const [applySellerApi, { isLoading }] = useApplySellerMutation();
  const { refetch } = useGetUserProfileQuery();

  const handleLogoChange = (e) => setLogo(e.target.files[0]);
  const handleBannerChange = (e) => setBanner(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shopName || !gstNumber || !accountNumber || !ifscCode || !bankName || !accountHolderName) {
      return toast.error('Please fill in all required fields');
    }

    const formData = new FormData();
    formData.append('shopName', shopName);
    formData.append('description', description);
    formData.append('gstNumber', gstNumber);
    formData.append('accountNumber', accountNumber);
    formData.append('ifscCode', ifscCode);
    formData.append('bankName', bankName);
    formData.append('accountHolderName', accountHolderName);

    if (logo) formData.append('shopLogo', logo);
    if (banner) formData.append('shopBanner', banner);

    try {
      await applySellerApi(formData).unwrap();
      toast.success('Application submitted! Pending administrative review.');
      
      // Update local storage user credentials
      const updated = await refetch().unwrap();
      dispatch(setCredentials({ user: updated.user, accessToken: localStorage.getItem('token') }));

      navigate('/dashboard');
    } catch (err) {
      toast.error(err.data?.message || 'Onboarding registration failed.');
    }
  };

  if (!user) {
    return (
      <div className="text-center p-12">
        <h3 className="text-xl font-bold">Please log in to apply as a seller.</h3>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto font-sans p-2">
      <div className="card bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <span className="p-2.5 bg-violet-600/20 text-violet-400 rounded-xl">
            <Store size={26} />
          </span>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-100">Merchant Onboarding</h2>
            <p className="text-xs text-slate-400">Apply to become an approved seller on NexMart AI Marketplace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>01</span> Shop Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase text-slate-400">Shop Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Electronics Store"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="input input-bordered bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase text-slate-400">GSTIN / Tax ID *</label>
                <input
                  type="text"
                  placeholder="e.g. 29AAAAA1111A1Z1"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="input input-bordered bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase text-slate-400">Shop Description</label>
              <textarea
                placeholder="Describe what your shop specializes in..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="textarea textarea-bordered bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
              />
            </div>

            {/* Logo and Banner uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase text-slate-400">Shop Logo (Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="file-input file-input-bordered file-input-sm bg-slate-950 border-slate-800 text-slate-400 text-xs rounded-lg w-full"
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase text-slate-400">Shop Banner (Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="file-input file-input-bordered file-input-sm bg-slate-950 border-slate-800 text-slate-400 text-xs rounded-lg w-full"
                />
              </div>
            </div>
          </div>

          {/* Financial details */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>02</span> Payout Bank Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase text-slate-400">Account Holder Name *</label>
                <input
                  type="text"
                  placeholder="As registered in passbook"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="input input-bordered bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase text-slate-400">Bank Name *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="input input-bordered bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase text-slate-400">Account Number *</label>
                <input
                  type="text"
                  placeholder="Enter Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="input input-bordered bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase text-slate-400">IFSC Code *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0000123"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="input input-bordered bg-slate-950 border-slate-800 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
                  required
                />
              </div>
            </div>
          </div>

          {/* Guidelines info */}
          <div className="alert bg-slate-950 border-slate-800/80 p-4 rounded-xl flex gap-3 text-xs text-slate-400">
            <ShieldCheck size={20} className="text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">Legal Verification Guarantee</p>
              <p className="mt-1">By submitting, you agree that your merchant activity is compliant with regional tax standards. Admin verification usually takes 24 hours.</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full bg-gradient-to-r from-violet-600 to-pink-600 border-none shadow-lg text-white font-bold tracking-wide rounded-lg flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <>
                Submit Seller Application <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellerRegister;
