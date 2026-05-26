import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cartItems: localStorage.getItem('cartItems') ? JSON.parse(localStorage.getItem('cartItems')) : [],
  shippingAddress: localStorage.getItem('shippingAddress') ? JSON.parse(localStorage.getItem('shippingAddress')) : null,
  appliedCoupon: null,
  subTotal: 0,
  discount: 0,
  totalPrice: 0
};

const variantKey = (variant) => {
  if (!variant) return '';
  return `${variant.name || ''}:${variant.option || ''}`;
};

// Calculate cart totals helper
const calcTotals = (state) => {
  state.cartItems = state.cartItems
    .map((item) => ({
      ...item,
      price: Number(item.price) || 0,
      qty: Math.max(1, Number(item.qty) || 1),
      images: Array.isArray(item.images) ? item.images : [],
    }))
    .filter((item) => item.product);

  state.subTotal = state.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  
  if (state.appliedCoupon) {
    const coupon = state.appliedCoupon;
    if (state.subTotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'percentage') {
        state.discount = (state.subTotal * coupon.discountValue) / 100;
      } else {
        state.discount = coupon.discountValue;
      }
    } else {
      state.appliedCoupon = null; // invalid due to lower price
      state.discount = 0;
    }
  } else {
    state.discount = 0;
  }

  state.totalPrice = Math.max(0, state.subTotal - state.discount);
  
  // Save items to local storage
  localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload; // { product, title, price, images, qty, variant }
      const normalizedItem = {
        ...item,
        qty: Math.max(1, Number(item.qty) || 1),
        price: Number(item.price) || 0,
        images: Array.isArray(item.images) ? item.images : [],
      };
      const existItem = state.cartItems.find(x => x.product === normalizedItem.product && variantKey(x.variant) === variantKey(normalizedItem.variant));

      if (existItem) {
        existItem.qty += normalizedItem.qty;
      } else {
        state.cartItems.push(normalizedItem);
      }
      calcTotals(state);
    },
    updateCartQty: (state, action) => {
      const { product, qty, variant } = action.payload;
      const existItem = state.cartItems.find(x => x.product === product && variantKey(x.variant) === variantKey(variant));
      if (existItem) {
        existItem.qty = Math.max(1, Number(qty) || 1);
      }
      calcTotals(state);
    },
    removeFromCart: (state, action) => {
      const { product, variant } = action.payload;
      state.cartItems = state.cartItems.filter(
        x => !(x.product === product && variantKey(x.variant) === variantKey(variant))
      );
      calcTotals(state);
    },
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      localStorage.setItem('shippingAddress', JSON.stringify(action.payload));
    },
    applyCouponCode: (state, action) => {
      state.appliedCoupon = action.payload; // { code, discountType, discountValue, minOrderValue }
      calcTotals(state);
    },
    removeCouponCode: (state) => {
      state.appliedCoupon = null;
      calcTotals(state);
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.appliedCoupon = null;
      state.subTotal = 0;
      state.discount = 0;
      state.totalPrice = 0;
      localStorage.removeItem('cartItems');
    }
  }
});

export const { 
  addToCart, 
  updateCartQty, 
  removeFromCart, 
  saveShippingAddress, 
  applyCouponCode, 
  removeCouponCode, 
  clearCart 
} = cartSlice.actions;

export default cartSlice.reducer;
export const getCartDetails = (state) => state.cart;
