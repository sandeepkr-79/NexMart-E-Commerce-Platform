class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword ? {
      $or: [
        { title: { $regex: this.queryStr.keyword, $options: 'i' } },
        { description: { $regex: this.queryStr.keyword, $options: 'i' } },
        { brand: { $regex: this.queryStr.keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(this.queryStr.keyword, 'i')] } }
      ]
    } : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };

    // Remove fields from the query parsing
    const removeFields = ['keyword', 'limit', 'page', 'sort'];
    removeFields.forEach(el => delete queryCopy[el]);

    // Advance filter for price, ratings etc (e.g. gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    const parsedQuery = JSON.parse(queryStr);
    
    // Convert array strings into actual arrays for MongoDB matches
    for (const key in parsedQuery) {
      if (parsedQuery[key] && typeof parsedQuery[key] === 'object' && parsedQuery[key].$in) {
        if (typeof parsedQuery[key].$in === 'string') {
          parsedQuery[key].$in = parsedQuery[key].$in.split(',');
        }
      }
    }

    this.query = this.query.find(parsedQuery);
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  pagination(resPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resPerPage * (currentPage - 1);
    
    this.query = this.query.limit(resPerPage).skip(skip);
    return this;
  }
}

export default APIFeatures;
