import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, Heart, MapPin, MessageSquare, ArrowRight, Package, CheckCircle, Clock } from 'lucide-react';
import { useGetMyOrdersQuery } from '../../app/apiSlice.js';
import { selectCurrentUser } from '../../app/authSlice.js';

const UserDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data: ordersData, isLoading } = useGetMyOrdersQuery();

  const orders = ordersData?.orders || [];
  const recentOrders = orders.slice(0, 3);

  const statusColor = {
    Placed: 'badge-info',
    Packed: 'badge-warning',
    Shipped: 'badge-secondary',
    'Out for Delivery': 'badge-accent',
    Delivered: 'badge-success',
    Cancelled: 'badge-error',
    Returned: 'badge-neutral'
  };

  const cards = [
    { label: 'Total Orders', value: orders.length, icon: <ShoppingBag size={20} className="text-violet-400" />, link: '/dashboard/orders', color: 'border-violet-500/20 bg-violet-500/5' },
    { label: 'Saved Addresses', value: user?.addresses?.length || 0, icon: <MapPin size={20} className="text-emerald-400" />, link: '/dashboard/addresses', color: 'border-emerald-500/20 bg-emerald-500/5' },
    { label: 'Wishlist Items', value: '—', icon: <Heart size={20} className="text-pink-400" />, link: '/dashboard/wishlist', color: 'border-pink-500/20 bg-pink-500/5' },
    { label: 'AI Chat Sessions', value: '—', icon: <MessageSquare size={20} className="text-blue-400" />, link: '/dashboard/chats', color: 'border-blue-500/20 bg-blue-500/5' },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">
          Welcome back, <span className="text-violet-400">{user?.name?.split(' ')[0]}</span>!
        </h2>
        <p className="text-xs text-slate-400 mt-1">Manage your orders, wishlist, and account details below.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Link
            key={i}
            to={card.link}
            className={`p-5 rounded-2xl border ${card.color} flex flex-col gap-3 hover:scale-[1.02] transition-all`}
          >
            <div className="flex justify-between items-start">
              {card.icon}
              <ArrowRight size={14} className="text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-100">{card.value}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Recent Orders</h3>
          <Link to="/dashboard/orders" className="text-xs text-violet-400 hover:underline flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl h-16"></div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <Package size={36} className="mx-auto text-slate-600" />
            <p className="text-sm text-slate-400 font-medium">No orders placed yet.</p>
            <Link to="/products" className="btn btn-primary btn-sm">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <Link
                key={order._id}
                to={`/dashboard/orders`}
                className="flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-violet-500/30 rounded-xl p-4 transition-all"
              >
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Package size={18} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`badge ${statusColor[order.orderStatus] || 'badge-neutral'} badge-xs py-2 px-2.5 text-[9px] font-bold uppercase`}>
                    {order.orderStatus}
                  </span>
                  <span className="text-xs font-extrabold text-slate-300">₹{order.totalPrice.toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Seller CTA */}
      {user?.sellerStatus === 'none' && user?.role === 'customer' && (
        <div className="bg-gradient-to-r from-violet-900/30 to-pink-900/20 border border-violet-500/20 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-slate-100">Start Selling on NexMart</h4>
            <p className="text-xs text-slate-400 mt-1">Join thousands of merchants and use AI-powered tools to grow your business.</p>
          </div>
          <Link to="/seller/onboarding" className="btn btn-primary btn-sm shrink-0 bg-gradient-to-r from-violet-600 to-pink-600 border-none font-bold">
            Apply Now
          </Link>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
