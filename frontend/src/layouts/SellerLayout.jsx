import React from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  BarChart3,
  Store,
  Settings,
  Sparkles,
} from "lucide-react";
import { selectCurrentUser } from "../app/authSlice.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Chatbot from "../components/Chatbot.jsx";
import { useSocket } from "../hooks/useSocket.jsx";

const SellerLayout = () => {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  // Initialize socket
  useSocket();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authorize: Only approved sellers can access the shop backend
  if (user.role !== "seller" || user.sellerStatus !== "approved") {
    if (user.sellerStatus === "pending") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/seller/onboarding" replace />;
  }

  const sidebarLinks = [
    {
      name: "Shop Overview",
      path: "/seller",
      icon: <LayoutDashboard size={16} />,
    },
    {
      name: "My Products",
      path: "/seller/products",
      icon: <ShoppingBag size={16} />,
    },
    {
      name: "Add Product",
      path: "/seller/add-product",
      icon: <PlusCircle size={16} />,
    },
    {
      name: "Incoming Orders",
      path: "/seller/orders",
      icon: <ShoppingBag size={16} className="text-secondary" />,
    },
    {
      name: "Shop Analytics",
      path: "/seller/analytics",
      icon: <BarChart3 size={16} />,
    },
    {
      name: "Shop Settings",
      path: "/seller/profile",
      icon: <Store size={16} />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-base-100 font-sans text-slate-100">
      <Navbar />

      <div className="flex-1 w-full mx-auto max-w-[1400px] p-4 md:p-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 h-fit space-y-4">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-200">Shop Manager</h3>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
                Verified Merchant
              </p>
            </div>
            <span className="p-1.5 bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-violet-400 rounded-lg">
              <Sparkles size={16} className="animate-pulse" />
            </span>
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
                        ? "bg-gradient-to-r from-violet-600/10 to-pink-600/10 text-violet-400 border border-violet-500/20"
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
        </aside>

        {/* Action Board */}
        <section className="flex-1 min-w-0 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 min-h-[500px]">
          <Outlet />
        </section>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default SellerLayout;
