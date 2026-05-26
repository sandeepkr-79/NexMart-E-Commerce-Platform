import React from "react";
import {
  Activity,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetPlatformStatsQuery } from "../../app/apiSlice.js";

const currency = (value = 0) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const chartColors = ["#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

const StatCard = ({ icon: Icon, label, value, detail, tone }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
    <div className={`mb-4 inline-flex rounded-lg p-3 ${tone}`}>
      <Icon size={20} />
    </div>
    <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
    <p className="text-sm text-slate-400">{label}</p>
    {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
  </div>
);

const EmptyChart = () => (
  <div className="flex h-64 items-center justify-center text-sm text-slate-500">
    No chart data yet
  </div>
);

const AdminDashboard = () => {
  const { data, isLoading, isError } = useGetPlatformStatsQuery();
  const metrics = data?.metrics || {};
  const revenueTimeline = data?.revenueTimeline || [];
  const orderStatusBreakdown = data?.orderStatusBreakdown || [];
  const paymentMethodBreakdown = data?.paymentMethodBreakdown || [];
  const userRoleBreakdown = data?.userRoleBreakdown || [];
  const topProducts = data?.topProducts || [];

  if (isLoading) {
    return (
      <div className="space-y-6 font-sans">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-900" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-lg bg-slate-900" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-slate-900" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-400">
          Unable to load admin metrics. Check backend connectivity and admin auth.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Admin Dashboard</h2>
        <p className="text-xs text-slate-400">
          Live marketplace performance, fulfillment, and catalog health.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CreditCard}
          label="Total revenue"
          value={currency(metrics.totalRevenue)}
          detail={`AOV ${currency(metrics.averageOrderValue)}`}
          tone="bg-violet-500/10 text-violet-300"
        />
        <StatCard
          icon={Activity}
          label="Total orders"
          value={metrics.ordersCount || 0}
          detail={`${metrics.pendingOrdersCount || 0} active fulfillment orders`}
          tone="bg-emerald-500/10 text-emerald-300"
        />
        <StatCard
          icon={User}
          label="Total users"
          value={metrics.usersCount || 0}
          detail={`${metrics.sellersCount || 0} sellers`}
          tone="bg-cyan-500/10 text-cyan-300"
        />
        <StatCard
          icon={ShoppingBag}
          label="Products"
          value={metrics.productsCount || 0}
          detail={`${metrics.approvedProductsCount || 0} approved · ${metrics.pendingProductsCount || 0} pending`}
          tone="bg-amber-500/10 text-amber-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100">Revenue Trend</h3>
              <p className="text-xs text-slate-500">Paid and COD order value, last 30 days</p>
            </div>
            <PackageCheck size={18} className="text-violet-400" />
          </div>
          {revenueTimeline.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTimeline}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }}
                    formatter={(value, name) => [name === "revenue" ? currency(value) : value, name]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#revenueFill)" strokeWidth={2} />
                  <Bar dataKey="orders" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100">Payment Mix</h3>
              <p className="text-xs text-slate-500">Razorpay vs COD</p>
            </div>
            <CreditCard size={18} className="text-cyan-400" />
          </div>
          {paymentMethodBreakdown.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodBreakdown} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={4}>
                    {paymentMethodBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-1 font-bold text-slate-100">Order Status</h3>
          <p className="mb-4 text-xs text-slate-500">Current fulfillment distribution</p>
          {orderStatusBreakdown.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusBreakdown} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} width={96} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-1 font-bold text-slate-100">User Roles</h3>
          <p className="mb-4 text-xs text-slate-500">Accounts by access level</p>
          {userRoleBreakdown.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userRoleBreakdown} dataKey="value" nameKey="name" outerRadius={92} label>
                    {userRoleBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100">Seller Verification</h3>
              <p className="text-xs text-slate-500">Approved seller coverage</p>
            </div>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-4xl font-black text-slate-100">{metrics.verifiedSellerRate || 0}%</p>
              <p className="text-xs text-slate-500">
                {metrics.verifiedSellersCount || 0} of {metrics.sellersCount || 0} sellers verified
              </p>
            </div>
            <progress className="progress progress-success w-full" value={metrics.verifiedSellerRate || 0} max="100"></progress>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-1 font-bold text-slate-100">Top Products</h3>
        <p className="mb-4 text-xs text-slate-500">Ranked by order revenue</p>
        {topProducts.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="title" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} height={70} angle={-12} textAnchor="end" />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }}
                  formatter={(value, name) => [name === "revenue" ? currency(value) : value, name]}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unitsSold" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
