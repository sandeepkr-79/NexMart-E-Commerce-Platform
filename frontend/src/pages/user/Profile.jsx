import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Save, Eye, EyeOff } from 'lucide-react';
import { selectCurrentUser, setCredentials } from '../../app/authSlice.js';
import { useUpdateUserProfileMutation } from '../../app/apiSlice.js';
import toast from 'react-hot-toast';

const Profile = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [updateProfile, { isLoading }] = useUpdateUserProfileMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) return toast.error('Passwords do not match');
    try {
      const payload = { name };
      if (password) payload.password = password;
      const res = await updateProfile(payload).unwrap();
      dispatch(setCredentials({ user: res.user, accessToken: localStorage.getItem('token') }));
      toast.success('Profile updated successfully');
      setPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-lg">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Profile Details</h2>
        <p className="text-xs text-slate-400 mt-1">Manage your name, email and password</p>
      </div>

      {/* Avatar display */}
      <div className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-2xl font-black">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-slate-200">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
          <span className={`badge badge-xs mt-1 ${user?.role === 'admin' ? 'badge-error' : user?.role === 'seller' ? 'badge-secondary' : 'badge-primary'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="form-control">
          <label className="label text-xs font-bold uppercase text-slate-400">Full Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="input input-bordered bg-slate-950 border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full" required />
        </div>

        <div className="form-control">
          <label className="label text-xs font-bold uppercase text-slate-400">Email Address</label>
          <input type="email" value={user?.email} disabled
            className="input input-bordered bg-slate-950 border-slate-800 text-slate-500 text-sm rounded-lg w-full opacity-60 cursor-not-allowed" />
        </div>

        <div className="divider text-[10px] text-slate-600 uppercase tracking-widest my-1">Change Password (optional)</div>

        <div className="form-control">
          <label className="label text-xs font-bold uppercase text-slate-400">New Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="input input-bordered bg-slate-950 border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full pr-10" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-slate-500">
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>

        {password && (
          <div className="form-control">
            <label className="label text-xs font-bold uppercase text-slate-400">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="input input-bordered bg-slate-950 border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full" />
          </div>
        )}

        <button type="submit" disabled={isLoading}
          className="btn btn-primary w-full bg-gradient-to-r from-violet-600 to-pink-600 border-none font-bold text-white rounded-lg flex items-center justify-center gap-2">
          {isLoading ? <span className="loading loading-spinner"/> : <><Save size={15}/> Save Changes</>}
        </button>
      </form>
    </div>
  );
};

export default Profile;
