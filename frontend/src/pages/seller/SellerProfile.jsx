import React, { useState } from "react";
import { useUpdateSellerProfileMutation } from "../../app/apiSlice.js";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../app/authSlice.js";
import toast from "react-hot-toast";

const SellerProfile = () => {
  const user = useSelector(selectCurrentUser);
  const [updateProfile, { isLoading }] = useUpdateSellerProfileMutation();
  const [sellerData, setSellerData] = useState({
    businessName: user?.seller?.businessName || "",
    phone: user?.seller?.phone || "",
    address: user?.seller?.address || "",
    city: user?.seller?.city || "",
    state: user?.seller?.state || "",
    country: user?.seller?.country || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(sellerData).unwrap();
      toast.success("Seller profile updated successfully.");
    } catch (err) {
      toast.error(err.data?.message || "Unable to update seller profile.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">
          Seller Profile
        </h2>
        <p className="text-xs text-slate-400">
          Update your shop details and contact information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Business Name
            </label>
            <input
              type="text"
              value={sellerData.businessName}
              onChange={(e) =>
                setSellerData({ ...sellerData, businessName: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Phone
            </label>
            <input
              type="text"
              value={sellerData.phone}
              onChange={(e) =>
                setSellerData({ ...sellerData, phone: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Address
            </label>
            <input
              type="text"
              value={sellerData.address}
              onChange={(e) =>
                setSellerData({ ...sellerData, address: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              City
            </label>
            <input
              type="text"
              value={sellerData.city}
              onChange={(e) =>
                setSellerData({ ...sellerData, city: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              State
            </label>
            <input
              type="text"
              value={sellerData.state}
              onChange={(e) =>
                setSellerData({ ...sellerData, state: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Country
            </label>
            <input
              type="text"
              value={sellerData.country}
              onChange={(e) =>
                setSellerData({ ...sellerData, country: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary bg-gradient-to-r from-violet-600 to-pink-600 border-none w-full text-white font-bold"
        >
          {isLoading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default SellerProfile;
