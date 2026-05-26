import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";
import SellerLayout from "./layouts/SellerLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

import Home from "./pages/public/Home.jsx";
import Products from "./pages/public/Products.jsx";
import ProductDetail from "./pages/public/ProductDetail.jsx";
import Login from "./pages/public/Login.jsx";
import Signup from "./pages/public/Signup.jsx";
import SellerRegister from "./pages/public/SellerRegister.jsx";
import NotFound from "./pages/public/NotFound.jsx";

import UserDashboard from "./pages/user/UserDashboard.jsx";
import MyOrders from "./pages/user/MyOrders.jsx";
import Profile from "./pages/user/Profile.jsx";
import Addresses from "./pages/user/Addresses.jsx";
import Wishlist from "./pages/user/Wishlist.jsx";
import Chats from "./pages/user/Chats.jsx";
import Cart from "./pages/user/Cart.jsx";

import SellerDashboard from "./pages/seller/SellerDashboard.jsx";
import SellerProducts from "./pages/seller/SellerProducts.jsx";
import AddProduct from "./pages/seller/AddProduct.jsx";
import SellerOrders from "./pages/seller/SellerOrders.jsx";
import SellerAnalytics from "./pages/seller/SellerAnalytics.jsx";
import SellerProfile from "./pages/seller/SellerProfile.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Users from "./pages/admin/Users.jsx";
import Sellers from "./pages/admin/Sellers.jsx";
import ProductsAdmin from "./pages/admin/Products.jsx";
import Orders from "./pages/admin/Orders.jsx";
import AIManagement from "./pages/admin/AIManagement.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="seller/onboarding" element={<SellerRegister />} />
          <Route path="cart" element={<Cart />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/dashboard" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="chats" element={<Chats />} />
        </Route>

        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="analytics" element={<SellerAnalytics />} />
          <Route path="profile" element={<SellerProfile />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="sellers" element={<Sellers />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="orders" element={<Orders />} />
          <Route path="ai-management" element={<AIManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
