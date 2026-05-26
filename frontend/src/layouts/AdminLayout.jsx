import React from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  Users,
  Store,
  ShieldAlert,
  ShoppingBag,
  Settings2,
  Sparkles,
} from "lucide-react";
import { selectCurrentUser } from "../app/authSlice.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Chatbot from "../components/Chatbot.jsx";
import { useSocket } from "../hooks/useSocket.jsx";

const AdminLayout = () => {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  // Initialize socket
  useSocket();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authorize Admin role
  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const sidebarLinks = [
    {
      name: "Admin Dashboard",
      path: "/admin",
      icon: <LayoutDashboard size={16} />,
    },
    {
      name: "User Management",
      path: "/admin/users",
      icon: <Users size={16} />,
    },
    {
      name: "Seller Applications",
      path: "/admin/sellers",
      icon: <Store size={16} />,
    },
    {
      name: "Product Listings",
      path: "/admin/products",
      icon: <ShoppingBag size={16} />,
    },
    {
      name: "Global Orders",
      path: "/admin/orders",
      icon: <ShoppingBag size={16} className="text-pink-400" />,
    },
    {
      name: "AI & RAG Management",
      path: "/admin/ai-management",
      icon: <Settings2 size={16} />,
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
              <h3 className="font-bold text-sm text-slate-200">
                Admin Console
              </h3>
              <p className="text-[10px] text-red-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert size={10} /> Full Control
              </p>
            </div>
            <span className="p-1.5 bg-red-500/10 text-red-400 rounded-lg">
              <Sparkles size={16} />
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
                        ? "bg-red-500/10 text-red-400 border border-red-500/25"
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

        {/* Content */}
        <section className="flex-1 min-w-0 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 min-h-[500px]">
          <Outlet />
        </section>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default AdminLayout;
