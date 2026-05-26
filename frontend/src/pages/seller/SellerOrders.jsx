import React from "react";
import { useGetSellerOrdersQuery } from "../../app/apiSlice.js";
import { Package, Clock, Truck } from "lucide-react";

const SellerOrders = () => {
  const { data, isLoading, isError } = useGetSellerOrdersQuery();
  const orders = data?.orders || [];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">
          Incoming Orders
        </h2>
        <p className="text-xs text-slate-400">
          Track orders from your customers and update shipping milestones.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-slate-900 border border-slate-800 rounded-3xl h-28"
            ></div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
          <p className="text-sm text-slate-400">
            Unable to load seller orders. Please check API connectivity.
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <Package size={36} className="mx-auto text-violet-400" />
          <p className="text-sm text-slate-400">
            No orders have been placed for your products yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <h3 className="font-bold text-slate-100">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="badge badge-primary badge-sm">
                  {order.orderStatus}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Truck size={16} /> {order.products.length} item(s)
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} /> ₹{order.totalPrice?.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Package size={16} /> {(order.paymentMethod || "razorpay").toUpperCase()} · {order.paymentStatus}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
