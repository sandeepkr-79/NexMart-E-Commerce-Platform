import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, Search } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-10 shadow-2xl shadow-slate-950/30">
        <p className="text-7xl font-black text-violet-400">404</p>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-100">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xl">
          The page you are looking for does not exist or has been moved. Try
          browsing the marketplace instead.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="btn btn-primary bg-gradient-to-r from-violet-600 to-pink-600 border-none w-full sm:w-auto"
          >
            Go to Home
          </Link>
          <Link
            to="/products"
            className="btn btn-outline text-slate-200 border-slate-700 w-full sm:w-auto"
          >
            Browse Products <Search size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
