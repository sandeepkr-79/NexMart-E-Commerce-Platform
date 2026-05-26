import React from "react";
import { Link } from "react-router-dom";
import {
  useGetSellerAnalyticsQuery,
  useGetSellerProfileQuery,
} from "../../app/apiSlice.js";
import {
  AlertTriangle,
  Package,
  PlusCircle,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const currency = (value = 0) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const MetricCard = ({ label, value, detail, icon: Icon, tone }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
    <div className={`mb-4 inline-flex rounded-lg p-3 ${tone}`}>
      <Icon size={20} />
    </div>
    <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
    <h3 className="mt-2 text-2xl font-extrabold text-slate-100">{value}</h3>
    {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
  </div>
);

const EmptyPanel = ({ children }) => (
  <div className="flex h-56 items-center justify-center text-center text-sm text-slate-500">
    {children}
  </div>
);

const SellerDashboard = () => {
  const { data: analyticsData, isLoading, isError } = useGetSellerAnalyticsQuery(undefined, {
    pollingInterval: 15000,
    refetchOnMountOrArgChange: true,
  });
  const { data: profileData } = useGetSellerProfileQuery();
  const metrics = analyticsData?.metrics || {};
  const lowStockAlerts = analyticsData?.lowStockAlerts || [];
  const recentOrders = analyticsData?.recentOrders || [];
  const dailyRevenue = analyticsData?.analytics?.dailyRevenue || [];
  const orderStatusBreakdown = analyticsData?.orderStatusBreakdown || [];
  const topProducts = analyticsData?.topProducts || [];
  const shopName = profileData?.profile?.shopName || "Your Store";

  if (isLoading) {
    return (
      <div className="space-y-6 font-sans">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-slate-900" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-lg bg-slate-900" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-lg bg-slate-900" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-400">
          Seller dashboard data failed to load. Check backend connectivity and seller auth.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">Seller Dashboard</h2>
          <p className="text-xs text-slate-400">
            Live shop performance, order flow, and inventory health.
          </p>
        </div>
        <Link
          to="/seller/add-product"
          className="btn btn-primary btn-sm border-none bg-gradient-to-r from-violet-600 to-pink-600"
        >
          <PlusCircle size={16} /> Add New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Shop Name"
          value={shopName}
          detail={`${metrics.liveProductsCount || 0} live · ${metrics.pendingProductsCount || 0} pending`}
          icon={ShoppingBag}
          tone="bg-violet-500/10 text-violet-300"
        />
        <MetricCard
          label="Products"
          value={metrics.productsCount || 0}
          detail={`${metrics.lowStockCount || 0} low stock alerts`}
          icon={Package}
          tone="bg-cyan-500/10 text-cyan-300"
        />
        <MetricCard
          label="Revenue Last 30d"
          value={currency(metrics.last30Revenue)}
          detail={`Month ${currency(metrics.monthRevenue)}`}
          icon={Wallet}
          tone="bg-emerald-500/10 text-emerald-300"
        />
        <MetricCard
          label="Orders"
          value={metrics.ordersCount || 0}
          detail={`${metrics.pendingOrdersCount || 0} pending · ${metrics.deliveredOrdersCount || 0} delivered`}
          icon={TrendingUp}
          tone="bg-amber-500/10 text-amber-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h3 className="font-bold text-slate-100">Revenue Trend</h3>
          <p className="mb-4 text-xs text-slate-500">Paid and COD seller revenue, last 30 days</p>
          {dailyRevenue.length === 0 ? (
            <EmptyPanel>No seller revenue yet.</EmptyPanel>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue}>
                  <defs>
                    <linearGradient id="sellerRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }}
                    formatter={(value, name) => [name === "revenue" ? currency(value) : value, name]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#sellerRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h3 className="font-bold text-slate-100">Order Flow</h3>
          <p className="mb-4 text-xs text-slate-500">Current seller order states</p>
          {orderStatusBreakdown.length === 0 ? (
            <EmptyPanel>No orders yet.</EmptyPanel>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusBreakdown} layout="vertical" margin={{ left: 22 }}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={92} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 xl:col-span-2">
          <h3 className="font-bold text-slate-100">Recent Orders</h3>
          <p className="mb-4 text-xs text-slate-500">Latest marketplace orders containing your products</p>
          {recentOrders.length === 0 ? (
            <EmptyPanel>No recent orders yet.</EmptyPanel>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-bold text-slate-200">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-500">{order.customerName}</p>
                  </div>
                  <p className="text-xs text-slate-400">{order.orderStatus}</p>
                  <p className="text-xs uppercase text-slate-400">{order.paymentMethod} · {order.paymentStatus}</p>
                  <p className="text-right text-sm font-bold text-emerald-400">{currency(order.totalPrice)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100">Low Stock Alerts</h3>
              <p className="text-xs text-slate-500">Products at 5 units or fewer</p>
            </div>
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          {lowStockAlerts.length === 0 ? (
            <EmptyPanel>Inventory is healthy.</EmptyPanel>
          ) : (
            <div className="space-y-3">
              {lowStockAlerts.map((product) => (
                <div key={product._id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <p className="truncate text-xs font-bold text-slate-200">{product.title}</p>
                  <span className="badge badge-warning badge-sm">{product.stock}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {topProducts.length > 0 && (
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h3 className="font-bold text-slate-100">Top Products</h3>
          <p className="mb-4 text-xs text-slate-500">Seller revenue by product</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="title" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8 }}
                  formatter={(value, name) => [name === "revenue" ? currency(value) : value, name]}
                />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unitsSold" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
};

export default SellerDashboard;
