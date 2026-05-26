import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { UserPlus, Sparkles } from 'lucide-react';
import { useRegisterMutation, useVerifyOtpMutation } from '../../app/apiSlice.js';
import { setCredentials } from '../../app/authSlice.js';
import toast from 'react-hot-toast';

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');

  const [registerApi, { isLoading }] = useRegisterMutation();
  const [verifyOtpApi, { isLoading: isVerifying }] = useVerifyOtpMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return toast.error('Please enter all fields');
    }

    try {
      await registerApi({ name, email, password }).unwrap();
      toast.success('Registration successful! OTP sent to your email.');
      setShowOtpModal(true);
    } catch (err) {
      toast.error(err.data?.message || 'Registration failed. Choose another email.');
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Enter OTP code');

    try {
      const response = await verifyOtpApi({ email, otp }).unwrap();
      dispatch(setCredentials(response));
      toast.success('Account verified and logged in!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.data?.message || 'Invalid or expired OTP');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] font-sans">
      <div className="card w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-500">
            Create an Account
          </h2>
          <p className="text-xs text-slate-400 font-medium">Join NexMart to buy products and talk to AI</p>
        </div>

        {!showOtpModal ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered bg-slate-950 border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <input
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered bg-slate-950 border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered bg-slate-950 border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full bg-gradient-to-r from-violet-600 to-pink-600 border-none shadow-lg text-white font-bold text-sm tracking-wide rounded-lg flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <UserPlus size={16} /> Register
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-400 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-400 hover:underline font-semibold">Log in</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div className="alert bg-violet-600/10 border-violet-500/20 text-slate-300 text-xs py-3 rounded-lg flex gap-2">
              <Sparkles size={16} className="text-violet-400 shrink-0 mt-0.5" />
              <div>
                We emailed a 6-digit OTP verification code to <strong>{email}</strong>. Check your console log if running locally!
              </div>
            </div>

            <div className="form-control">
              <label className="label text-xs font-bold uppercase tracking-wider text-slate-400">OTP Code</label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="input input-bordered text-center tracking-[8px] bg-slate-950 border-slate-800 text-slate-100 text-lg focus:outline-none focus:border-violet-500 rounded-lg w-full font-bold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="btn btn-primary w-full bg-gradient-to-r from-violet-600 to-pink-600 border-none shadow text-white font-bold rounded-lg"
            >
              {isVerifying ? <span className="loading loading-spinner"></span> : 'Verify & Sign Up'}
            </button>

            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="btn btn-ghost w-full btn-sm text-slate-400 text-xs"
            >
              Back to signup
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Signup;
