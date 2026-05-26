import React from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  User,
  MapPin,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { selectCurrentUser } from "../app/authSlice.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Chatbot from "../components/Chatbot.jsx";
import { useSocket } from "../hooks/useSocket.jsx";

const UserLayout = () => {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  // Initialize socket push notifications
  useSocket();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const sidebarLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    {
      name: "My Orders",
      path: "/dashboard/orders",
      icon: <ShoppingBag size={16} />,
    },
    {
      name: "Wishlist",
      path: "/dashboard/wishlist",
      icon: <Heart size={16} />,
    },
    {
      name: "Profile Details",
      path: "/dashboard/profile",
      icon: <User size={16} />,
    },
    {
      name: "Saved Addresses",
      path: "/dashboard/addresses",
      icon: <MapPin size={16} />,
    },
    {
      name: "My Chat Logs",
      path: "/dashboard/chats",
      icon: <MessageSquare size={16} />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-base-100 font-sans text-slate-100">
      <Navbar />

      <div className="flex-1 w-full mx-auto max-w-[1400px] p-4 md:p-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 h-fit space-y-4">
          <div className="px-3 py-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200">
              Customer Account
            </h3>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>

          <ul className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="pt-2 border-t border-slate-800">
            <Link
              to="/products"
              className="btn btn-ghost btn-xs text-xs text-slate-400 gap-1.5 flex justify-start pl-3 w-full"
            >
              <ArrowLeft size={12} /> Back to Shopping
            </Link>
          </div>
        </aside>

        {/* Content Board */}
        <section className="flex-1 min-w-0 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 min-h-[500px]">
          <Outlet />
        </section>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default UserLayout;
