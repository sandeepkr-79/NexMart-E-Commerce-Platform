import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Chatbot from "../components/Chatbot.jsx";
import { useSocket } from "../hooks/useSocket.jsx";

const PublicLayout = () => {
  // Initialize Socket connection
  useSocket();

  return (
    <div className="flex flex-col min-h-screen bg-base-100 font-sans text-slate-100 selection:bg-violet-500/30">
      {/* Top Header */}
      <Navbar />

      {/* Main Screen Outlet */}
      <main className="flex-1 w-full mx-auto max-w-[1400px] p-4 md:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating AI RAG Assistant */}
      <Chatbot />
    </div>
  );
};

export default PublicLayout;
