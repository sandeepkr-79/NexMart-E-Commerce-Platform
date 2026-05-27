import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logOut } from "./authSlice.js";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BACKEND_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    console.log("Access token expired, rotating session...");
    const refreshResult = await baseQuery(
      { url: "/api/auth/refresh", method: "POST" },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      const accessToken = refreshResult.data.accessToken;
      const user = api.getState().auth.user;
      api.dispatch(setCredentials({ user, accessToken }));
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Product",
    "Wishlist",
    "Order",
    "User",
    "Seller",
    "Review",
    "Coupon",
    "Chat",
    "Notification",
  ],
  endpoints: (builder) => ({
    // Auth Endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),
    register: builder.mutation({
      query: (data) => ({
        url: "/api/auth/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({ url: "/api/auth/logout", method: "POST" }),
      invalidatesTags: ["User"],
    }),
    googleLogin: builder.mutation({
      query: (data) => ({
        url: "/api/auth/google",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // User Profile Endpoints
    getUserProfile: builder.query({
      query: () => "/api/user/profile",
      providesTags: ["User"],
    }),
    updateUserProfile: builder.mutation({
      query: (data) => ({
        url: "/api/user/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    addAddress: builder.mutation({
      query: (addr) => ({
        url: "/api/user/address",
        method: "POST",
        body: addr,
      }),
      invalidatesTags: ["User"],
    }),
    deleteAddress: builder.mutation({
      query: (id) => ({ url: `/api/user/address/${id}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
    setDefaultAddress: builder.mutation({
      query: (id) => ({
        url: `/api/user/address/${id}/default`,
        method: "PUT",
      }),
      invalidatesTags: ["User"],
    }),

    // Public Product Endpoints
    getProducts: builder.query({
      query: (paramsStr = "") => `/api/products?${paramsStr}`,
      providesTags: ["Product"],
    }),
    getProductById: builder.query({
      query: (id) => `/api/products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),

    // Seller Endpoints
    applySeller: builder.mutation({
      query: (formData) => ({
        url: "/api/seller/apply",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["User", "Seller"],
    }),
    getSellerProfile: builder.query({
      query: () => "/api/seller/profile",
      providesTags: ["Seller"],
    }),
    updateSellerProfile: builder.mutation({
      query: (formData) => ({
        url: "/api/seller/profile",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Seller"],
    }),
    getSellerProducts: builder.query({
      query: () => "/api/seller/products",
      providesTags: ["Product"],
    }),
    createProduct: builder.mutation({
      query: (formData) => ({
        url: "/api/products",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/products/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/api/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Product"],
    }),
    getSellerOrders: builder.query({
      query: () => "/api/seller/orders",
      providesTags: ["Order"],
    }),
    getSellerAnalytics: builder.query({
      query: () => "/api/seller/analytics",
      providesTags: ["Order", "Product", "Review"],
    }),
    bulkImportCSV: builder.mutation({
      query: (formData) => ({
        url: "/api/seller/import-csv",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Product"],
    }),

    // Admin Endpoints
    getAllUsers: builder.query({
      query: (params = "") => `/api/admin/users?${params}`,
      providesTags: ["User"],
    }),
    createUserAdmin: builder.mutation({
      query: (data) => ({
        url: "/api/admin/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    updateUserAdmin: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/admin/users/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/api/admin/users/${id}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: ["User"],
    }),
    banUser: builder.mutation({
      query: ({ id, isBan, reason }) => ({
        url: `/api/admin/users/${id}/ban`,
        method: "PUT",
        body: { isBan, reason },
      }),
      invalidatesTags: ["User"],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/api/admin/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["User"],
    }),
    getSellerApplications: builder.query({
      query: () => "/api/admin/sellers",
      providesTags: ["Seller"],
    }),
    createSellerAdmin: builder.mutation({
      query: (data) => ({
        url: "/api/admin/sellers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Seller", "User"],
    }),
    updateSellerAdmin: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/admin/sellers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Seller", "User"],
    }),
    deleteSellerAdmin: builder.mutation({
      query: (id) => ({ url: `/api/admin/sellers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Seller", "User", "Product"],
    }),
    verifySeller: builder.mutation({
      query: ({ id, action, feedback }) => ({
        url: `/api/admin/sellers/${id}/verify`,
        method: "PUT",
        body: { action, feedback },
      }),
      invalidatesTags: ["Seller", "User"],
    }),
    sendMassNotice: builder.mutation({
      query: (data) => ({
        url: "/api/admin/sellers/notify",
        method: "POST",
        body: data,
      }),
    }),
    getAllProductsAdmin: builder.query({
      query: () => "/api/admin/products",
      providesTags: ["Product"],
    }),
    createProductAdmin: builder.mutation({
      query: (data) => ({
        url: "/api/admin/products",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProductAdmin: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/admin/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProductAdmin: builder.mutation({
      query: (id) => ({ url: `/api/admin/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Product"],
    }),
    approveProduct: builder.mutation({
      query: ({ id, isApproved }) => ({
        url: `/api/admin/products/${id}/approve`,
        method: "PUT",
        body: { isApproved },
      }),
      invalidatesTags: ["Product"],
    }),
    getPlatformStats: builder.query({
      query: () => "/api/admin/stats",
      providesTags: ["Order", "User", "Seller", "Product"],
    }),
    getOrders: builder.query({
      query: (params = "") => `/api/admin/orders?${params}`,
      providesTags: ["Order"],
    }),

    // Order Endpoints
    createOrder: builder.mutation({
      query: (order) => ({ url: "/api/orders", method: "POST", body: order }),
      invalidatesTags: ["Order"],
    }),
    confirmPayment: builder.mutation({
      query: (paymentData) => ({
        url: "/api/orders/confirm-payment",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Order"],
    }),
    getMyOrders: builder.query({
      query: () => "/api/orders/my-orders",
      providesTags: ["Order"],
    }),
    getOrderDetails: builder.query({
      query: (id) => `/api/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status, description }) => ({
        url: `/api/orders/${id}/status`,
        method: "PUT",
        body: { status, description },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Order", id },
        "Order",
      ],
    }),
    refundOrder: builder.mutation({
      query: ({ id, refundAmount }) => ({
        url: `/api/orders/${id}/refund`,
        method: "POST",
        body: { refundAmount },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Order", id },
        "Order",
      ],
    }),

    // Category Endpoints
    getCategories: builder.query({
      query: () => "/api/categories",
      providesTags: ["Category"],
    }),
    createCategory: builder.mutation({
      query: (data) => ({ url: "/api/categories", method: "POST", body: data }),
      invalidatesTags: ["Category"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/api/categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["Category"],
    }),

    // Wishlist Endpoints
    getWishlist: builder.query({
      query: () => "/api/wishlist",
      providesTags: ["Wishlist"],
    }),
    addToWishlist: builder.mutation({
      query: (productId) => ({
        url: `/api/wishlist/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["Wishlist"],
    }),
    removeFromWishlist: builder.mutation({
      query: (productId) => ({
        url: `/api/wishlist/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Wishlist"],
    }),

    // Review Endpoints
    getProductReviews: builder.query({
      query: (productId) => `/api/reviews/product/${productId}`,
      providesTags: ["Review"],
    }),
    createReview: builder.mutation({
      query: ({ productId, review }) => ({
        url: `/api/reviews/product/${productId}`,
        method: "POST",
        body: review,
      }),
      invalidatesTags: ["Review", "Product"],
    }),
    voteHelpful: builder.mutation({
      query: (id) => ({ url: `/api/reviews/${id}/helpful`, method: "PUT" }),
      invalidatesTags: ["Review"],
    }),
    sellerReplyReview: builder.mutation({
      query: ({ id, comment }) => ({
        url: `/api/reviews/${id}/reply`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: ["Review"],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({ url: `/api/reviews/${id}`, method: "DELETE" }),
      invalidatesTags: ["Review", "Product"],
    }),

    // Coupon Endpoints
    getCoupons: builder.query({
      query: () => "/api/coupons",
      providesTags: ["Coupon"],
    }),
    createCoupon: builder.mutation({
      query: (data) => ({ url: "/api/coupons", method: "POST", body: data }),
      invalidatesTags: ["Coupon"],
    }),
    validateCouponCode: builder.mutation({
      query: (data) => ({
        url: "/api/coupons/validate",
        method: "POST",
        body: data,
      }),
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({ url: `/api/coupons/${id}`, method: "DELETE" }),
      invalidatesTags: ["Coupon"],
    }),

    // AI Chat & Tools Endpoints
    sendChatMessage: builder.mutation({
      query: (data) => ({ url: "/api/ai/chat", method: "POST", body: data }),
      invalidatesTags: ["Chat"],
    }),
    getChatHistory: builder.query({
      query: () => "/api/ai/chat-history",
      providesTags: ["Chat"],
    }),
    uploadPdfManual: builder.mutation({
      query: (formData) => ({
        url: "/api/ai/upload-pdf",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Chat"],
    }),
    triggerReindexAI: builder.mutation({
      query: () => ({ url: "/api/ai/reindex", method: "POST" }),
    }),
    generateProductDesc: builder.mutation({
      query: (data) => ({
        url: "/api/ai/description",
        method: "POST",
        body: data,
      }),
    }),
    getAIPricingSuggestions: builder.query({
      query: ({ category, brand, basePrice }) =>
        `/api/ai/suggest-price?category=${category}&brand=${brand}&basePrice=${basePrice}`,
    }),
    generateAITagsSuggestion: builder.mutation({
      query: (data) => ({
        url: "/api/ai/generate-tags",
        method: "POST",
        body: data,
      }),
    }),
    getAICostStats: builder.query({
      query: () => "/api/ai/cost-dashboard",
    }),
  }),
});

export const {
  // Auth
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useLogoutMutation,
  useGoogleLoginMutation,

  // User Profile
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useAddAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,

  // Products
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,

  // Seller
  useApplySellerMutation,
  useGetSellerProfileQuery,
  useUpdateSellerProfileMutation,
  useGetSellerProductsQuery,
  useGetSellerOrdersQuery,
  useGetSellerAnalyticsQuery,
  useBulkImportCSVMutation,

  // Admin
  useGetAllUsersQuery,
  useCreateUserAdminMutation,
  useUpdateUserAdminMutation,
  useUpdateUserRoleMutation,
  useBanUserMutation,
  useDeleteUserMutation,
  useGetSellerApplicationsQuery,
  useCreateSellerAdminMutation,
  useUpdateSellerAdminMutation,
  useDeleteSellerAdminMutation,
  useVerifySellerMutation,
  useSendMassNoticeMutation,
  useGetAllProductsAdminQuery,
  useCreateProductAdminMutation,
  useUpdateProductAdminMutation,
  useDeleteProductAdminMutation,
  useApproveProductMutation,
  useGetPlatformStatsQuery,
  useGetOrdersQuery,

  // Orders
  useCreateOrderMutation,
  useConfirmPaymentMutation,
  useGetMyOrdersQuery,
  useGetOrderDetailsQuery,
  useUpdateOrderStatusMutation,
  useRefundOrderMutation,

  // Categories
  useGetCategoriesQuery,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,

  // Reviews
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useVoteHelpfulMutation,
  useSellerReplyReviewMutation,
  useDeleteReviewMutation,

  // Coupons
  useGetCouponsQuery,
  useCreateCouponMutation,
  useValidateCouponCodeMutation,
  useDeleteCouponMutation,

  // AI & RAG
  useSendChatMessageMutation,
  useGetChatHistoryQuery,
  useUploadPdfManualMutation,
  useTriggerReindexAIMutation,
  useGenerateProductDescMutation,
  useGetAIPricingSuggestionsQuery,
  useGenerateAITagsSuggestionMutation,
  useGetAICostStatsQuery,
} = apiSlice;
