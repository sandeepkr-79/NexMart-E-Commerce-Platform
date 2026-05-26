import React from "react";
import { useGetSellerAnalyticsQuery } from "../../app/apiSlice.js";
import { BarChart3, TrendingUp, Sparkles } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const SellerAnalytics = () => {
  const { data, isLoading, isError } = useGetSellerAnalyticsQuery();
  const analytics = data?.analytics || { dailyRevenue: [], products: [] };
  const metrics = data?.metrics || {};

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">
            Shop Analytics
          </h2>
          <p className="text-xs text-slate-400">
            View revenue trends, top sellers, and store performance at a glance.
          </p>
        </div>
        <span className="badge badge-outline badge-primary uppercase tracking-wider text-slate-300">
          Live data
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-slate-900 border border-slate-800 rounded-3xl h-52"
            ></div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
          <p className="text-sm text-slate-400">
            Analytics failed to load. Check your API connection.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-3 mb-3 text-slate-400">
                <TrendingUp size={18} /> Today's Revenue
              </div>
              <p className="text-3xl font-extrabold text-emerald-400">
                ₹{metrics.todayRevenue?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-3 mb-3 text-slate-400">
                <BarChart3 size={18} /> This Month
              </div>
              <p className="text-3xl font-extrabold text-violet-400">
                ₹{metrics.monthRevenue?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-3 mb-3 text-slate-400">
                <Sparkles size={18} /> Best Seller
              </div>
              <p className="text-sm text-slate-300">
                {analytics.products?.[0]?.title || "No product yet"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-bold text-slate-100 mb-3">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.dailyRevenue || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerAnalytics;
