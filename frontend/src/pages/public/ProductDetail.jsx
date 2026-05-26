import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, Heart, Shield, RefreshCw, Send, Check, AlertTriangle } from 'lucide-react';
import { 
  useGetProductByIdQuery, 
  useGetProductReviewsQuery, 
  useCreateReviewMutation, 
  useVoteHelpfulMutation 
} from '../../app/apiSlice.js';
import { addToCart } from '../../app/cartSlice.js';
import { selectCurrentUser } from '../../app/authSlice.js';
import RatingStars from '../../components/RatingStars.jsx';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const { data: prodData, isLoading, isError } = useGetProductByIdQuery(id);
  const { data: revData, refetch: refetchReviews } = useGetProductReviewsQuery(id);
  const [createReviewApi, { isLoading: isReviewPosting }] = useCreateReviewMutation();
  const [voteHelpfulApi] = useVoteHelpfulMutation();

  const [activeImage, setActiveImage] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});

  // Review Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Handle image index setups on data return
  React.useEffect(() => {
    if (prodData?.product?.images?.length > 0) {
      setActiveImage(prodData.product.images[0]);
      
      // Select default variants
      const defaults = {};
      prodData.product.variants.forEach(v => {
        if (v.options.length > 0) defaults[v.name] = v.options[0];
      });
      setSelectedVariants(defaults);
    }
  }, [prodData]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse max-w-5xl mx-auto font-sans p-4">
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-3xl w-full"></div>
      </div>
    );
  }

  if (isError || !prodData?.product) {
    return (
      <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto mt-12 space-y-4">
        <h3 className="text-lg font-bold text-red-500">Product details failed to load</h3>
        <p className="text-xs text-slate-400">The product may not exist or is pending administrative approval.</p>
        <Link to="/products" className="btn btn-primary btn-sm">Return to Catalog</Link>
      </div>
    );
  }

  const { product } = prodData;

  const handleVariantSelect = (vName, option) => {
    setSelectedVariants(prev => ({ ...prev, [vName]: option }));
  };

  const handleAddToCart = () => {
    const safeQty = Math.min(product.stock, Math.max(1, Number(qty) || 1));

    // Parse variants to save configurations
    const variantConfigurations = Object.keys(selectedVariants).map(key => ({
      name: key,
      option: selectedVariants[key]
    }))[0] || null; // for simplicity, save primary variant mapping

    dispatch(addToCart({
      product: product._id,
      title: product.title,
      price: product.price,
      images: product.images || [],
      stock: product.stock,
      qty: safeQty,
      variant: variantConfigurations
    }));
    
    toast.success(`${product.title} added to cart!`);
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!title || !body) return toast.error('Please enter title and content');

    try {
      await createReviewApi({
        productId: product._id,
        review: { rating, title, body }
      }).unwrap();
      
      toast.success('Review posted successfully!');
      setTitle('');
      setBody('');
      refetchReviews();
    } catch (err) {
      toast.error(err.data?.message || 'Only verified purchasers who have received the item can write reviews.');
    }
  };

  const handleHelpfulVote = async (reviewId) => {
    try {
      await voteHelpfulApi(reviewId).unwrap();
      refetchReviews();
    } catch (err) {
      toast.error('Could not register vote');
    }
  };

  return (
    <div className="max-w-5xl mx-auto font-sans space-y-12 pb-12">
      {/* Product specs row */}
      <section className="flex flex-col md:flex-row gap-8 bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-2xl relative">
        {/* Images Display */}
        <div className="flex-1 space-y-4">
          <figure className="relative h-96 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <img 
              src={activeImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'} 
              alt={product.title} 
              className="max-h-full max-w-full object-contain"
            />
          </figure>

          {/* Thumbnails row */}
          {product.images?.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto py-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-lg overflow-hidden bg-slate-950 border shrink-0 transition-all ${
                    activeImage === img ? 'border-violet-500 scale-[1.03]' : 'border-slate-800'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Configurations Column */}
        <div className="flex-1 space-y-5">
          <div className="space-y-1">
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500">{product.brand}</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-100">{product.title}</h1>
            <div className="pt-1 flex items-center gap-3">
              <RatingStars rating={product.ratings} reviewCount={product.reviewCount} size={15} />
              <span className="badge badge-outline border-slate-800 text-[10px] text-slate-400 py-2.5 px-3 rounded-full">
                {product.category?.name || 'Category'}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-slate-100">₹{product.price.toLocaleString('en-IN')}</span>
              {product.comparePrice > product.price && (
                <>
                  <span className="text-sm text-slate-500 line-through">₹{product.comparePrice.toLocaleString()}</span>
                  <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">
                    {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            
            {/* Stock indicator */}
            <div>
              {product.stock > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <Check size={14} /> In Stock ({product.stock} units remaining)
                </div>
              ) : (
                <div className="alert bg-red-500/10 border-red-500/20 text-xs py-2 px-3 text-red-400 rounded-lg flex gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <div>
                    Sold Out. Try asking our floating chatbot in the bottom right for alternatives!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI generated SEO descriptions annotation */}
          {product.aiDescription && (
            <div className="bg-violet-600/5 border border-violet-500/10 p-3 rounded-xl text-xs text-slate-300 italic leading-relaxed">
              <span className="font-bold text-violet-400 not-italic block mb-1">AI Highlights:</span>
              "{product.aiDescription}"
            </div>
          )}

          {/* Standard Description */}
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {product.description}
          </p>

          {/* Variants row */}
          {product.variants?.length > 0 && (
            <div className="space-y-3 pt-2">
              {product.variants.map((v) => (
                <div key={v.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-16">{v.name}:</span>
                  <div className="flex gap-2">
                    {v.options.map((opt) => {
                      const isSelected = selectedVariants[v.name] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleVariantSelect(v.name, opt)}
                          className={`btn btn-xs rounded px-2.5 font-bold ${
                            isSelected 
                              ? 'btn-primary text-white' 
                              : 'btn-neutral bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add to Cart Actions */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 pt-4 border-t border-slate-800/80">
              {/* Quantity counter */}
              <div className="join border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="join-item btn btn-ghost btn-xs text-xs font-black w-8 h-8 flex items-center justify-center"
                >
                  -
                </button>
                <span className="join-item px-3 text-xs font-bold text-slate-200 self-center">{qty}</span>
                <button 
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="join-item btn btn-ghost btn-xs text-xs font-black w-8 h-8 flex items-center justify-center"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn btn-primary bg-gradient-to-r from-violet-600 to-pink-600 border-none flex-1 text-white font-extrabold text-sm gap-2 rounded-xl shadow-lg shadow-violet-500/20"
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Product Reviews section */}
      <section className="space-y-6">
        <h2 className="text-xl font-extrabold text-slate-100 border-b border-slate-800 pb-3">
          Customer Reviews & Ratings
        </h2>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Reviews logs list */}
          <div className="flex-1 space-y-4">
            {revData?.reviews?.length === 0 ? (
              <div className="p-8 bg-slate-900/40 border border-slate-800 text-center rounded-2xl text-xs text-slate-400 font-medium">
                No reviews yet. Purchase the item to leave the first review!
              </div>
            ) : (
              revData?.reviews?.map((r) => (
                <div key={r._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-slate-800 text-slate-300 w-8 h-8 rounded-full border border-slate-800">
                          <span>{r.user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-200">{r.user.name}</h4>
                        <span className="text-[9px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <RatingStars rating={r.rating} size={12} />
                  </div>

                  <div className="space-y-1 pl-1">
                    <h5 className="font-bold text-sm text-slate-100">{r.title}</h5>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{r.body}</p>
                  </div>

                  {/* Reply container if merchant replied */}
                  {r.sellerReply && r.sellerReply.comment && (
                    <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl ml-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                        <span>Merchant Response</span>
                      </div>
                      <p className="text-xs text-slate-300 italic">"{r.sellerReply.comment}"</p>
                    </div>
                  )}

                  {/* Helpful trigger */}
                  <div className="pt-2 flex justify-start items-center">
                    <button
                      onClick={() => handleHelpfulVote(r._id)}
                      className="btn btn-ghost btn-xs text-[10px] font-bold gap-1 text-slate-500 hover:text-pink-400"
                    >
                      <Heart size={10} className="fill-current" /> Helpful ({r.helpful?.length || 0})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Write a review forms */}
          {user && (
            <div className="w-full md:w-80 bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit space-y-4">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-2">
                Write a Review
              </h3>
              
              <p className="text-[10px] text-slate-400 italic">
                Only users who purchased this item from NexMart can submit product ratings.
              </p>

              <form onSubmit={handlePostReview} className="space-y-3.5">
                <div className="form-control">
                  <label className="label text-xs font-bold text-slate-400 uppercase">Rating Score</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="select select-bordered select-sm bg-slate-950 border-slate-800 text-xs focus:outline-none focus:border-violet-500 rounded-lg w-full"
                  >
                    <option value={5}>5 Stars (Excellent)</option>
                    <option value={4}>4 Stars (Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                    <option value={2}>2 Stars (Poor)</option>
                    <option value={1}>1 Star (Awful)</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label text-xs font-bold text-slate-400 uppercase">Review Summary</label>
                  <input
                    type="text"
                    placeholder="Amazing quality!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input input-bordered input-sm bg-slate-950 border-slate-800 text-xs focus:outline-none focus:border-violet-500 rounded-lg w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label text-xs font-bold text-slate-400 uppercase">Review Details</label>
                  <textarea
                    placeholder="Detail your experience with performance, specs, packaging..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="textarea textarea-bordered bg-slate-950 border-slate-800 text-xs focus:outline-none focus:border-violet-500 rounded-lg w-full"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isReviewPosting}
                  className="btn btn-primary btn-sm w-full bg-gradient-to-r from-violet-600 to-pink-600 border-none text-white font-bold rounded-lg flex items-center justify-center gap-1.5"
                >
                  {isReviewPosting ? <span className="loading loading-spinner"></span> : <><Send size={12} /> Post Review</>}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
