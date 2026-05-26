import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, Search, Heart, User, LogOut, LayoutDashboard, Store, Settings, Sparkles } from 'lucide-react';
import { selectCurrentUser, logOut } from '../app/authSlice.js';
import { getCartDetails } from '../app/cartSlice.js';
import { useLogoutMutation } from '../app/apiSlice.js';
import toast from 'react-hot-toast';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { cartItems } = useSelector(getCartDetails);
  
  const [keyword, setKeyword] = useState('');
  const [logoutApi] = useLogoutMutation();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(keyword)}`);
    } else {
      navigate('/products');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logOut());
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      dispatch(logOut());
      navigate('/login');
    }
  };

  return (
    <header className="navbar sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-4 md:px-8 font-sans">
      <div className="flex-1 gap-2">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl md:text-2xl font-extrabold tracking-wider font-sans bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-500">
          <span className="p-1.5 bg-gradient-to-r from-violet-600 to-pink-600 rounded-lg text-white">
            <ShoppingBag size={20} className="stroke-[2.5]" />
          </span>
          <span>NexMart</span>
          <span className="hidden md:inline text-[9px] font-bold text-violet-400 px-1 border border-violet-500 rounded uppercase tracking-widest self-center mb-2 animate-pulse">AI</span>
        </Link>

        {/* Global Catalog Link */}
        <Link to="/products" className="btn btn-ghost btn-sm text-sm font-semibold tracking-wide hidden md:flex ml-4">
          Catalog
        </Link>
      </div>

      {/* Global Search Bar */}
      <div className="flex-none mx-4 max-w-md w-full hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search items, brands, tags..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input input-bordered input-sm w-full bg-slate-900 border-slate-800 text-slate-100 pl-10 focus:outline-none focus:border-violet-500 rounded-lg"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
        </form>
      </div>

      {/* Icons & Dropdowns */}
      <div className="flex-none gap-3 md:gap-5">
        {/* Search button on small screens */}
        <Link to="/products" className="btn btn-ghost btn-circle btn-sm sm:hidden">
          <Search size={20} />
        </Link>

        {/* Wishlist Link */}
        {user && (
          <Link to="/dashboard/wishlist" className="btn btn-ghost btn-circle btn-sm relative text-slate-300 hover:text-pink-400">
            <Heart size={20} />
          </Link>
        )}

        {/* Shopping Cart Badge */}
        <Link to="/cart" className="btn btn-ghost btn-circle btn-sm relative text-slate-300 hover:text-violet-400">
          <div className="indicator">
            <ShoppingBag size={20} />
            {cartItems.length > 0 && (
              <span className="badge badge-primary badge-xs indicator-item text-[10px] w-4 h-4 font-bold rounded-full">
                {cartItems.reduce((acc, i) => acc + i.qty, 0)}
              </span>
            )}
          </div>
        </Link>

        {/* Auth State Dropdown */}
        {user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar border border-slate-800">
              <div className="w-9 rounded-full bg-slate-800 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-extrabold text-violet-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-2xl bg-slate-900 border border-slate-800 rounded-box w-56 text-slate-200">
              <li className="px-3 py-2 border-b border-slate-800">
                <span className="font-semibold text-violet-300 block text-xs truncate">Hello, {user.name}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold block">{user.role} Account</span>
              </li>

              {/* Customer Dashboard Links */}
              <li>
                <Link to="/dashboard" className="py-2 hover:text-violet-400">
                  <LayoutDashboard size={14} /> Customer Dashboard
                </Link>
              </li>

              {/* Seller Dashboard Links */}
              {user.role === 'seller' && user.sellerStatus === 'approved' && (
                <li>
                  <Link to="/seller" className="py-2 hover:text-violet-400">
                    <Store size={14} /> Shop Manager
                  </Link>
                </li>
              )}

              {/* Admin Panel Links */}
              {user.role === 'admin' && (
                <li>
                  <Link to="/admin" className="py-2 hover:text-violet-400">
                    <Settings size={14} /> Admin Controls
                  </Link>
                </li>
              )}

              {/* Become a Seller link */}
              {user.role === 'customer' && user.sellerStatus === 'none' && (
                <li>
                  <Link to="/seller/onboarding" className="py-2 hover:text-pink-400 font-semibold">
                    <Sparkles size={14} className="text-pink-400 animate-pulse" /> Become a Seller
                  </Link>
                </li>
              )}
              {user.sellerStatus === 'pending' && (
                <li className="disabled py-1 px-3 text-[11px] text-amber-500 italic font-medium">
                  Seller application pending...
                </li>
              )}

              <li>
                <button onClick={handleLogout} className="py-2 text-error hover:bg-error/10">
                  <LogOut size={14} /> Logout
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-outline border-slate-800 hover:bg-slate-800 btn-sm text-xs font-semibold rounded-lg">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm text-xs font-bold rounded-lg shadow-lg shadow-violet-500/20">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
