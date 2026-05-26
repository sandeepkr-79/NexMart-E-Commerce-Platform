import React, { useState } from "react";
import {
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../../app/apiSlice.js";
import { CheckCircle2, ClipboardList, PackageCheck, Truck } from "lucide-react";

const statusOptions = [
  "Placed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const quickStatuses = [
  { label: "Packed", value: "Packed", icon: PackageCheck },
  { label: "Shipped", value: "Shipped", icon: Truck },
  { label: "Delivered", value: "Delivered", icon: CheckCircle2 },
];

const statusTone = {
  Placed: "badge-info",
  Packed: "badge-primary",
  Shipped: "badge-secondary",
  "Out for Delivery": "badge-warning",
  Delivered: "badge-success",
  Cancelled: "badge-error",
  Returned: "badge-error",
};

const Orders = () => {
  const { data, isLoading, isError } = useGetOrdersQuery();
  const [updateOrderStatus, { isLoading: isUpdating }] =
    useUpdateOrderStatusMutation();
  const [selectedStatus, setSelectedStatus] = useState({});
  const orders = data?.orders || [];

  const changeStatus = async (order, status) => {
    await updateOrderStatus({
      id: order._id,
      status,
      description: `Admin marked order as ${status}.`,
    }).unwrap();
  };

  const submitSelectedStatus = async (order) => {
    const status = selectedStatus[order._id] || order.orderStatus;
    await changeStatus(order, status);
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">All Orders</h2>
        <p className="text-xs text-slate-400">
          Globally manage fulfillment status for every marketplace order.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg border border-slate-800 bg-slate-900"
            ></div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-sm text-slate-400">
            Unable to load orders. Check backend services or auth status.
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <ClipboardList size={36} className="mx-auto text-violet-400" />
          <p className="text-sm text-slate-400">
            No orders have been placed yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900 p-5 lg:grid-cols-[1.1fr_1fr_1.6fr]"
            >
              <div>
                <p className="text-xs text-slate-500">Order ID</p>
                <p className="font-semibold text-slate-100">
                  #{order._id.slice(-8).toUpperCase()}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {order.user?.name || "Unknown customer"} ·{" "}
                  {order.user?.email || "No email"}
                </p>
              </div>

              <div className="text-sm text-slate-400">
                <p className="capitalize">{order.paymentStatus}</p>
                <p className="uppercase text-xs text-slate-500">
                  {order.paymentMethod || "razorpay"}
                </p>
                <p>Rs. {order.totalPrice?.toLocaleString()}</p>
                <p className="mt-2 flex items-center gap-2 text-xs">
                  <Truck size={14} />
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span
                    className={`badge badge-sm ${
                      statusTone[order.orderStatus] || "badge-outline"
                    }`}
                  >
                    {order.orderStatus}
                  </span>
                  {quickStatuses.map(({ label, value, icon: Icon }) => (
                    <button
                      key={value}
                      className="btn btn-outline btn-xs"
                      type="button"
                      disabled={isUpdating || order.orderStatus === value}
                      onClick={() => changeStatus(order, value)}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <select
                    className="select select-bordered select-sm bg-slate-950"
                    value={selectedStatus[order._id] || order.orderStatus}
                    onChange={(event) =>
                      setSelectedStatus((current) => ({
                        ...current,
                        [order._id]: event.target.value,
                      }))
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    disabled={isUpdating}
                    onClick={() => submitSelectedStatus(order)}
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
