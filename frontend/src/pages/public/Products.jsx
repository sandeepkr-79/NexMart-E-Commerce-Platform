import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useGetProductsQuery, useGetCategoriesQuery } from '../../app/apiSlice.js';
import RatingStars from '../../components/RatingStars.jsx';
import { Filter, SlidersHorizontal, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Local filter states syncing with searchParams
  const [keywordInput, setKeywordInput] = useState(searchParams.get('keyword') || '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('price[lte]') || '100000');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-createdAt');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Sync inputs with URL changes (e.g. searching from Navbar)
  useEffect(() => {
    setKeywordInput(searchParams.get('keyword') || '');
    setSelectedCat(searchParams.get('category') || '');
    setPriceMax(searchParams.get('price[lte]') || '100000');
    setSortBy(searchParams.get('sort') || '-createdAt');
    setCurrentPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  // Construct API Query String
  const getQueryString = () => {
    const params = new URLSearchParams();
    if (keywordInput) params.append('keyword', keywordInput);
    if (selectedCat) params.append('category[in]', selectedCat); // filter category
    if (priceMax) params.append('price[lte]', priceMax);
    if (sortBy) params.append('sort', sortBy);
    params.append('page', currentPage);
    params.append('limit', 8); // 8 items per page
    return params.toString();
  };

  const { data, isLoading, isError, refetch } = useGetProductsQuery(getQueryString());
  const { data: catData } = useGetCategoriesQuery();

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    
    const params = {};
    if (keywordInput) params.keyword = keywordInput;
    if (selectedCat) params.category = selectedCat;
    if (priceMax) params['price[lte]'] = priceMax;
    if (sortBy) params.sort = sortBy;
    params.page = 1; // Reset to page 1 on filter trigger
    
    setSearchParams(params);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setKeywordInput('');
    setSelectedCat('');
    setPriceMax('100000');
    setSortBy('-createdAt');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const newParams = Object.fromEntries(searchParams.entries());
    newParams.page = page;
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-violet-400" /> Marketplace Catalog
          </h1>
          <p className="text-xs text-slate-400 font-medium">Browse verified merchant inventory listings</p>
        </div>

        {/* Global Sorting */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown size={14} className="text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              const newParams = Object.fromEntries(searchParams.entries());
              newParams.sort = e.target.value;
              setSearchParams(newParams);
            }}
            className="select select-bordered select-sm bg-slate-900 border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-violet-500 rounded-lg w-full sm:w-auto"
          >
            <option value="-createdAt">Newest Additions</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-ratings">Highest Rated</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Filters Panel */}
        <aside className="w-full md:w-64 bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Filter size={16} className="text-violet-400" /> Filter Options
            </h3>
            <button 
              onClick={handleClearFilters}
              className="text-[10px] uppercase font-bold text-slate-400 hover:text-violet-400"
            >
              Reset All
            </button>
          </div>

          <form onSubmit={handleApplyFilters} className="space-y-5">
            {/* Search Keyword */}
            <div className="form-control">
              <label className="label text-xs font-bold uppercase text-slate-400">Search Text</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Brand, titles..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className="input input-bordered input-sm bg-slate-950 border-slate-800 text-slate-200 pl-8 focus:outline-none focus:border-violet-500 rounded-lg w-full"
                />
                <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="form-control">
              <label className="label text-xs font-bold uppercase text-slate-400">Category</label>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="select select-bordered select-sm bg-slate-950 border-slate-800 text-xs focus:outline-none focus:border-violet-500 rounded-lg w-full"
              >
                <option value="">All Categories</option>
                {catData?.categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Price Max Filter */}
            <div className="form-control">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
                <span>Max Price</span>
                <span className="text-violet-400">₹{Number(priceMax).toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="range range-primary range-xs"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-semibold">
                <span>₹1k</span>
                <span>₹100k</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm w-full bg-gradient-to-r from-violet-600 to-pink-600 border-none shadow text-white font-bold rounded-lg"
            >
              Apply Filter
            </button>
          </form>
        </aside>

        {/* Right Catalog Grid */}
        <div className="flex-1 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-900 border border-slate-800 rounded-2xl h-80 w-full"></div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-400">Catalog items failed to load. Please verify API server state.</p>
            </div>
          ) : data?.products?.length === 0 ? (
            <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <p className="text-base font-bold text-slate-300">No products found matching filters</p>
              <p className="text-xs text-slate-500">Try modifying your search criteria or resetting filters.</p>
              <button onClick={handleClearFilters} className="btn btn-primary btn-xs mt-3">Reset Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {data?.products?.map((p) => (
                  <Link
                    to={`/product/${p._id}`}
                    key={p._id}
                    className="card bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-violet-500/30 hover:scale-[1.01] transition-all group cursor-pointer"
                  >
                    <figure className="relative h-44 overflow-hidden bg-slate-950">
                      <img
                        src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {p.stock === 0 && (
                        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                          <span className="badge badge-error badge-sm font-bold uppercase py-2 px-3 rounded-full text-white">Out of Stock</span>
                        </div>
                      )}
                    </figure>

                    <div className="p-4 space-y-2">
                      <span className="text-[10px] uppercase font-extrabold text-slate-500">{p.brand}</span>
                      <h3 className="font-bold text-sm text-slate-200 truncate group-hover:text-violet-400 transition-colors">{p.title}</h3>
                      <RatingStars rating={p.ratings} reviewCount={p.reviewCount} size={13} />

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-base font-extrabold text-slate-100">₹{p.price.toLocaleString('en-IN')}</span>
                        {p.comparePrice > p.price && (
                          <span className="text-xs text-slate-500 line-through">₹{p.comparePrice.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {data?.totalProducts > 8 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-800/60 text-xs font-semibold">
                  <span className="text-slate-500">
                    Showing {data.products.length} of {data.totalProducts} results
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn btn-sm btn-outline border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 gap-1 rounded-lg"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage * 8 >= data.totalProducts}
                      className="btn btn-sm btn-outline border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 gap-1 rounded-lg"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
