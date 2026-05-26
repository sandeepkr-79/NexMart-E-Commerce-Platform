import React, { useState } from 'react';
import { useGetMyOrdersQuery } from '../../app/apiSlice.js';
import { Package, ChevronDown, ChevronUp, CheckCircle, Circle, MapPin } from 'lucide-react';

const statusColor = {
  Placed: 'badge-info', Packed: 'badge-warning', Shipped: 'badge-secondary',
  'Out for Delivery': 'badge-accent', Delivered: 'badge-success',
  Cancelled: 'badge-error', Returned: 'badge-neutral'
};

const MyOrders = () => {
  const { data, isLoading } = useGetMyOrdersQuery();
  const [expanded, setExpanded] = useState(null);
  const orders = data?.orders || [];

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map(i=><div key={i} className="animate-pulse bg-slate-900 border border-slate-800 rounded-2xl h-24"/>)}
    </div>
  );

  if (orders.length === 0) return (
    <div className="text-center p-16 space-y-4">
      <Package size={48} className="mx-auto text-slate-600"/>
      <h3 className="font-bold text-slate-300">No orders yet</h3>
      <p className="text-xs text-slate-500">Your order history will appear here once you make a purchase.</p>
    </div>
  );

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">My Orders</h2>
        <p className="text-xs text-slate-400 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order._id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Order Header */}
            <div
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-800/40 transition-all"
              onClick={() => setExpanded(expanded === order._id ? null : order._id)}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-xl">
                  <Package size={18} className="text-violet-400"/>
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-200">#{order._id.slice(-10).toUpperCase()}</p>
                  <p className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`badge ${statusColor[order.orderStatus]||'badge-neutral'} badge-sm py-2 px-3 text-[10px] font-bold uppercase`}>
                    {order.orderStatus}
                  </span>
                  <p className="text-sm font-extrabold text-slate-200 mt-1">₹{order.totalPrice.toLocaleString()}</p>
                </div>
                {expanded === order._id ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
              </div>
            </div>

            {/* Expanded Details */}
            {expanded === order._id && (
              <div className="border-t border-slate-800 p-5 space-y-5">
                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Items Ordered</h4>
                  {order.products?.map((item, i) => (
                    <div key={i} className="flex gap-3 items-center bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                      <img
                        src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={item.product?.title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-900"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{item.product?.title}</p>
                        <p className="text-[10px] text-slate-500">Qty: {item.qty} × ₹{item.price?.toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-extrabold text-slate-300">₹{(item.qty * item.price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Tracking Timeline */}
                {order.trackingSteps?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Shipment Tracking</h4>
                    <div className="space-y-2">
                      {order.trackingSteps.map((step, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="shrink-0 mt-0.5">
                            {i === order.trackingSteps.length - 1
                              ? <CheckCircle size={14} className="text-violet-400"/>
                              : <Circle size={14} className="text-slate-600"/>}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-300">{step.status}</p>
                            <p className="text-[10px] text-slate-500">{step.description}</p>
                            <p className="text-[9px] text-slate-600">{new Date(step.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                <div className="flex gap-2 items-start text-xs text-slate-400 bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                  <MapPin size={14} className="text-violet-400 shrink-0 mt-0.5"/>
                  <div>
                    <p className="font-bold text-slate-300">Shipping To</p>
                    <p>{order.shippingAddress?.street}, {order.shippingAddress?.city} - {order.shippingAddress?.zipCode}</p>
                  </div>
                </div>

                {/* Payment info */}
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Payment Status</span>
                  <span className={order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}>
                    {(order.paymentMethod || 'razorpay').toUpperCase()} · {order.paymentStatus?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
