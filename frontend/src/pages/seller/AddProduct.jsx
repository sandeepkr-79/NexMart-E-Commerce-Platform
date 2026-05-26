import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateProductMutation,
  useGetCategoriesQuery,
} from "../../app/apiSlice.js";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../app/authSlice.js";
import toast from "react-hot-toast";

const AddProduct = () => {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { data: categoriesData } = useGetCategoriesQuery();
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const [product, setProduct] = useState({
    title: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    comparePrice: "",
    stock: "",
    tags: "",
    aiDescription: "",
  });

  const [images, setImages] = useState([]);
  const [variantName, setVariantName] = useState("");
  const [variantOption, setVariantOption] = useState("");
  const [variants, setVariants] = useState([]);

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleAddVariant = () => {
    if (!variantName || !variantOption) return;
    const options = variantOption
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);

    setVariants([...variants, { name: variantName, options }]);
    setVariantName("");
    setVariantOption("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product.title || !product.price || !product.category) {
      return toast.error("Please complete the required fields.");
    }

    const formData = new FormData();
    Object.entries(product).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("tags", product.tags);
    formData.append("variants", JSON.stringify(variants));
    images.forEach((file) => formData.append("images", file));

    try {
      await createProduct(formData).unwrap();
      toast.success("Product added successfully.");
      navigate("/seller/products");
    } catch (err) {
      toast.error(err.data?.message || "Unable to add product.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">Add Product</h2>
        <p className="text-xs text-slate-400">
          Create a new listing to grow your shop inventory.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Product Title *
            </label>
            <input
              type="text"
              value={product.title}
              onChange={(e) =>
                setProduct({ ...product, title: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
              required
            />
          </div>
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Brand
            </label>
            <input
              type="text"
              value={product.brand}
              onChange={(e) =>
                setProduct({ ...product, brand: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label text-xs text-slate-400 uppercase font-bold">
            Description
          </label>
          <textarea
            value={product.description}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
            className="textarea textarea-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Category *
            </label>
            <select
              value={product.category}
              onChange={(e) =>
                setProduct({ ...product, category: e.target.value })
              }
              className="select select-bordered select-sm bg-slate-950 border-slate-800 text-sm rounded-lg"
              required
            >
              <option value="">Select category</option>
              {categoriesData?.categories?.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Price *
            </label>
            <input
              type="number"
              value={product.price}
              onChange={(e) =>
                setProduct({ ...product, price: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
              required
            />
          </div>
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Compare Price
            </label>
            <input
              type="number"
              value={product.comparePrice}
              onChange={(e) =>
                setProduct({ ...product, comparePrice: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Stock Quantity
            </label>
            <input
              type="number"
              value={product.stock}
              onChange={(e) =>
                setProduct({ ...product, stock: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              SEO Tags
            </label>
            <input
              type="text"
              placeholder="comma separated"
              value={product.tags}
              onChange={(e) => setProduct({ ...product, tags: e.target.value })}
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              AI Description
            </label>
            <input
              type="text"
              value={product.aiDescription}
              onChange={(e) =>
                setProduct({ ...product, aiDescription: e.target.value })
              }
              className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label text-xs text-slate-400 uppercase font-bold">
              Product Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file-input file-input-bordered file-input-sm bg-slate-950 border-slate-800 text-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label text-xs text-slate-400 uppercase font-bold">
                Variant Name
              </label>
              <input
                type="text"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
              />
            </div>
            <div className="form-control">
              <label className="label text-xs text-slate-400 uppercase font-bold">
                Variant Options
              </label>
              <input
                type="text"
                placeholder="comma separated"
                value={variantOption}
                onChange={(e) => setVariantOption(e.target.value)}
                className="input input-bordered bg-slate-950 border-slate-800 text-sm rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {variants.map((variant, index) => (
            <span
              key={index}
              className="badge badge-outline badge-sm text-slate-200"
            >
              {variant.name}: {variant.options.join(", ")}
            </span>
          ))}
          <button
            type="button"
            onClick={handleAddVariant}
            className="btn btn-ghost btn-xs text-violet-400 border border-violet-500/20"
          >
            Add Variant
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary bg-gradient-to-r from-violet-600 to-pink-600 border-none w-full text-white font-bold"
        >
          {isLoading ? "Saving..." : "Publish Product"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
