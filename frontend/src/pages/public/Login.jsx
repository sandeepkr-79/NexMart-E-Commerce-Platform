import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LogIn } from "lucide-react";
import {
  useLoginMutation,
  useGoogleLoginMutation,
} from "../../app/apiSlice.js";
import { setCredentials } from "../../app/authSlice.js";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginApi, { isLoading }] = useLoginMutation();
  const [googleLoginApi] = useGoogleLoginMutation();

  const redirectPath = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please enter all fields");
    }

    try {
      const response = await loginApi({ email, password }).unwrap();
      dispatch(setCredentials(response));
      toast.success(`Welcome back, ${response.user.name}!`);

      // Redirect based on role
      if (response.user.role === "admin") navigate("/admin");
      else if (response.user.role === "seller") navigate("/seller");
      else navigate(redirectPath);
    } catch (err) {
      console.error(err);
      toast.error(
        err.data?.message || "Login failed. Please check credentials.",
      );
    }
  };

  // Google OAuth Login Simulation
  const handleGoogleLogin = async () => {
    try {
      const mockGoogleUser = {
        email: email || "google_user@gmail.com",
        name: "Google User",
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        googleToken: `g_token_${Math.random().toString(36).substring(2)}`,
      };

      const response = await googleLoginApi(mockGoogleUser).unwrap();
      dispatch(setCredentials(response));
      toast.success(`Google login successful!`);
      navigate(redirectPath);
    } catch (err) {
      toast.error("Google login simulation failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] font-sans">
      <div className="card w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-500">
            Welcome to NexMart
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Log in to manage shop, buy, or chat with AI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label text-xs font-bold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              placeholder="customer@nexmart.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered bg-slate-950 border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-violet-500 rounded-lg w-full"
              required
            />
          </div>

          <div className="form-control">
            <div className="flex justify-between items-center">
              <label className="label text-xs font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-violet-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="Password123"
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
                <LogIn size={16} /> Log In
              </>
            )}
          </button>

          <div className="divider text-[10px] text-slate-500 uppercase tracking-widest my-2">
            Or continue with
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-outline border-slate-800 hover:bg-slate-800 hover:text-white w-full rounded-lg text-xs font-bold gap-2 flex items-center justify-center"
          >
            <span className="font-extrabold text-violet-400">G</span> Sign in
            with Google
          </button>

          <div className="text-center text-xs text-slate-400 mt-4">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-violet-400 hover:underline font-semibold"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
