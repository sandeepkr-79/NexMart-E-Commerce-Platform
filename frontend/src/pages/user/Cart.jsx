import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  ShoppingCart,
  Percent,
  MapPin,
  CheckCircle,
  CreditCard,
  Sparkles,
} from "lucide-react";
import {
  getCartDetails,
  updateCartQty,
  removeFromCart,
  applyCouponCode,
  removeCouponCode,
  clearCart,
} from "../../app/cartSlice.js";
import { selectCurrentUser } from "../../app/authSlice.js";
import {
  useValidateCouponCodeMutation,
  useCreateOrderMutation,
  useConfirmPaymentMutation,
} from "../../app/apiSlice.js";
import toast from "react-hot-toast";

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { cartItems, appliedCoupon, subTotal, discount, totalPrice } =
    useSelector(getCartDetails);

  const [couponInput, setCouponInput] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Address inputs if user wants to type a custom one
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("India");

  // Checkout modal controls
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  const [validateCoupon, { isLoading: isValidating }] =
    useValidateCouponCodeMutation();
  const [createOrder, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();
  const [confirmPayment, { isLoading: isPaying }] = useConfirmPaymentMutation();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const existingScript = document.getElementById("razorpay-script");
      if (existingScript) return resolve(true);

      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Pick default address when user loads page
  React.useEffect(() => {
    if (user?.addresses?.length > 0) {
      const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setSelectedAddress(def);
    }
  }, [user]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput) return;

    try {
      const res = await validateCoupon({
        code: couponInput,
        subtotal: subTotal,
      }).unwrap();
      dispatch(applyCouponCode(res));
      setCouponInput("");
      toast.success(
        `Coupon "${res.code}" applied! Save ₹${res.discountAmount}`,
      );
    } catch (err) {
      toast.error(err.data?.message || "Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCouponCode());
    setCouponInput("");
    toast.success("Coupon removed");
  };

const handleInitiatePayment = () => {
    // Ensure user is logged in
    if (!user) {
      toast.error("Please log in to complete checkout");
      return navigate("/login");
    }

    // Ensure cart is not empty
    if (cartItems.length === 0) return;

    // Validate shipping address
    if (!selectedAddress && (!street || !city || !zipCode)) {
      return toast.error("Please select or fill a shipping address");
    }

    // COD flow: place order directly without Razorpay modal
    if (paymentMethod === "cod") {
      const placeCodOrder = async () => {
        try {
          const orderPayload = {
            items: cartItems,
            couponCode: appliedCoupon?.code || "",
            shippingAddress: selectedAddress
              ? {
                  street: selectedAddress.street,
                  city: selectedAddress.city,
                  state: selectedAddress.state,
                  zipCode: selectedAddress.zipCode,
                  country: selectedAddress.country,
                }
              : { street, city, state, zipCode, country },
            paymentMethod: "cod",
          };
          const orderRes = await createOrder(orderPayload).unwrap();
          toast.success("COD order placed successfully.");
          dispatch(clearCart());
          dispatch(removeCouponCode());
          navigate("/dashboard/orders");
        } catch (err) {
          toast.error(err.data?.message || "Failed to place COD order");
        }
      };
      placeCodOrder();
      return;
    }

    // Online payment flow: open Razorpay modal
    setShowPaymentModal(true);
  };

  const handleCheckoutSubmit = async () => {
    const shippingAddress = selectedAddress
      ? {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          country: selectedAddress.country,
        }
      : { street, city, state, zipCode, country };

    try {
      const orderPayload = {
        items: cartItems,
        couponCode: appliedCoupon?.code || "",
        shippingAddress,
        paymentMethod,
      };

      const orderRes = await createOrder(orderPayload).unwrap();

      if (orderRes.paymentMethod === "cod") {
        toast.success("COD order placed successfully.");
        dispatch(clearCart());
        dispatch(removeCouponCode());
        setShowPaymentModal(false);
        navigate("/dashboard/orders");
        return;
      }

      const razorpayLoaded = await loadRazorpayScript();

      if (!razorpayLoaded || !window.Razorpay) {
        toast.error("Unable to load Razorpay checkout. Please try again.");
        return;
      }

      const options = {
        key: orderRes.razorpayKeyId || "",
        amount: orderRes.razorpayAmount,
        currency: orderRes.currency,
        order_id: orderRes.razorpayOrderId,
        name: "NexMart",
        description: "Marketplace purchase",
        handler: async (response) => {
          try {
            await confirmPayment({
              orderId: orderRes.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }).unwrap();
            toast.success("Payment completed! Order placed successfully.");
            dispatch(clearCart());
            dispatch(removeCouponCode());
            setShowPaymentModal(false);
            navigate("/dashboard/orders");
          } catch (err) {
            toast.error(err.data?.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          order_id: orderRes.orderId,
        },
        theme: {
          color: "#7c3aed",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error(err.data?.message || "Checkout failed during processing");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto mt-12 space-y-4 font-sans">
        <ShoppingCart
          size={48}
          className="mx-auto text-slate-600 animate-pulse"
        />
        <h3 className="text-lg font-bold text-slate-300">
          Your shopping cart is empty
        </h3>
        <p className="text-xs text-slate-500">
          Search items in our catalog and add variants to checkout.
        </p>
        <Link to="/products" className="btn btn-primary btn-sm">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="font-sans space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <ShoppingCart size={22} className="text-violet-400" /> Shopping Cart
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Verify your items and apply promotional vouchers
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left items list */}
        <div className="flex-1 space-y-4">
          {cartItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center"
            >
              <img
                src={
                  item.images?.[0] ||
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150"
                }
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg bg-slate-950 border border-slate-850 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.product}`}
                  className="font-bold text-sm text-slate-200 hover:text-violet-400 truncate block"
                >
                  {item.title}
                </Link>
                {item.variant && (
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    {item.variant.name}: {item.variant.option}
                  </span>
                )}
                <span className="text-xs text-slate-300 font-semibold block mt-1">
                  ₹{item.price.toLocaleString()}
                </span>
              </div>

              {/* Quantity selectors */}
              <div className="join border border-slate-800 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                <button
                  onClick={() =>
                    dispatch(
                      updateCartQty({
                        product: item.product,
                        qty: Math.max(1, item.qty - 1),
                        variant: item.variant,
                      }),
                    )
                  }
                  className="join-item btn btn-ghost btn-xs text-xs font-black w-7 h-7"
                >
                  -
                </button>
                <span className="join-item px-2 text-xs font-bold text-slate-300 self-center">
                  {item.qty}
                </span>
                <button
                  onClick={() =>
                    dispatch(
                      updateCartQty({
                        product: item.product,
                        qty: item.stock ? Math.min(item.stock, item.qty + 1) : item.qty + 1,
                        variant: item.variant,
                      }),
                    )
                  }
                  className="join-item btn btn-ghost btn-xs text-xs font-black w-7 h-7"
                >
                  +
                </button>
              </div>

              {/* Delete button */}
              <button
                onClick={() =>
                  dispatch(
                    removeFromCart({
                      product: item.product,
                      variant: item.variant,
                    }),
                  )
                }
                className="btn btn-ghost btn-circle btn-sm text-slate-500 hover:text-red-500 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {/* Shipping address select panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <MapPin size={16} className="text-violet-400" /> Shipping
              Destination
            </h3>

            {user?.addresses?.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {user.addresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddress(addr)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedAddress?._id === addr._id
                          ? "border-violet-500 bg-violet-600/5"
                          : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
                        <span>Address ID</span>
                        {addr.isDefault && (
                          <span className="text-violet-400">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 mt-1 font-semibold">
                        {addr.street}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {addr.city}, {addr.state} - {addr.zipCode}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedAddress(null)}
                  className={`btn btn-ghost btn-xs text-[10px] uppercase font-bold ${!selectedAddress ? "text-violet-400" : "text-slate-400"}`}
                >
                  Use Custom/New Address
                </button>
              </div>
            ) : null}

            {/* Custom address inputs */}
            {!selectedAddress && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Street / Locality"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="input input-bordered input-sm bg-slate-950 border-slate-850 text-xs focus:outline-none focus:border-violet-500 rounded-lg w-full sm:col-span-3"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input input-bordered input-sm bg-slate-950 border-slate-850 text-xs focus:outline-none focus:border-violet-500 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input input-bordered input-sm bg-slate-950 border-slate-850 text-xs focus:outline-none focus:border-violet-500 rounded-lg w-full"
                />
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="input input-bordered input-sm bg-slate-950 border-slate-850 text-xs focus:outline-none focus:border-violet-500 rounded-lg w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Summary column */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          {/* Coupon codes panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Percent size={15} className="text-violet-400" /> Apply Discount
              Coupon
            </h3>

            {!appliedCoupon ? (
              <form onSubmit={handleApplyCoupon} className="join w-full">
                <input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="input input-bordered input-sm join-item bg-slate-950 border-slate-800 text-xs w-full focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isValidating}
                  className="btn btn-primary btn-sm join-item text-white font-bold"
                >
                  Apply
                </button>
              </form>
            ) : (
              <div className="flex justify-between items-center text-xs bg-violet-600/10 border border-violet-500/20 p-2.5 rounded-lg">
                <div>
                  <span className="font-extrabold text-violet-400 uppercase">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Applied successfully
                  </span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-[10px] text-red-500 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-500 italic">
              Try code **WELCOME10** for 10% off or **FLAT500** for flat ₹500
              off (orders &gt; ₹5,000)!
            </p>
          </div>

          {/* Bill summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs font-semibold text-slate-400">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="text-slate-200">
                  ₹{subTotal.toLocaleString()}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon Discount</span>
                  <span>- ₹{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Shipping Fees</span>
                <span className="text-green-400 font-bold">FREE</span>
              </div>

              <hr className="border-slate-850 my-1" />

              <div className="flex justify-between text-sm font-extrabold text-slate-100">
                <span>Total Amount</span>
                <span className="text-violet-400">
                  ₹{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Payment Method
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`btn btn-sm rounded-lg ${
                    paymentMethod === "razorpay"
                      ? "btn-primary"
                      : "btn-outline border-slate-800 text-slate-300"
                  }`}
                >
                  Razorpay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`btn btn-sm rounded-lg ${
                    paymentMethod === "cod"
                      ? "btn-primary"
                      : "btn-outline border-slate-800 text-slate-300"
                  }`}
                >
                  COD
                </button>
              </div>
            </div>

            <button
              onClick={handleInitiatePayment}
              className="btn btn-primary bg-gradient-to-r from-violet-600 to-pink-600 border-none w-full text-white font-extrabold text-sm rounded-xl shadow-lg mt-2"
            >
              {paymentMethod === "cod" ? "Place COD Order" : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>

      {/* Payment checkout modal popup (Razorpay checkout) */}
      {showPaymentModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-slate-900 border border-slate-800 rounded-2xl p-6 font-sans">
            <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <CreditCard className="text-violet-400" /> Secure Payment Gateway
            </h3>

            <div className="space-y-4">
              <div className="alert bg-violet-600/10 border-violet-500/20 text-xs py-3 px-3 text-slate-300 rounded-lg">
                <Sparkles
                  size={14}
                  className="text-violet-400 shrink-0 inline mr-1 animate-pulse"
                />
                {paymentMethod === "cod"
                  ? "Your order will be placed now and payment will be collected on delivery."
                  : "Razorpay checkout will open when you click Pay Now. We securely verify the payment before finalizing your order."}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Order amount
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-200 font-semibold">
                    {paymentMethod === "cod"
                      ? "Amount due on delivery"
                      : "Total to be charged"}
                  </span>
                  <span className="text-violet-400 font-bold">
                    ₹{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-action flex gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn btn-sm btn-outline border-slate-800 text-slate-400 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckoutSubmit}
                disabled={isPaying || isCreatingOrder}
                className="btn btn-sm btn-primary text-white bg-gradient-to-r from-violet-600 to-pink-600 border-none font-bold rounded-lg px-6 flex items-center gap-1.5"
              >
                {isPaying ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    {paymentMethod === "cod" ? "Place Order" : "Pay Now"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
