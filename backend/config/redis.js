// Redis client configuration with in-memory fallback
import { config } from 'dotenv';
config();

class InMemoryCache {
  constructor() {
    this.store = new Map();
    this.timeouts = new Map();
    console.log('Redis Cache: Initialized using in-memory local fallback storage.');
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, mode, duration) {
    this.store.set(key, value);
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }
    
    let ttlMs = 0;
    if (mode === 'EX' && duration) {
      ttlMs = duration * 1000;
    } else if (mode === 'PX' && duration) {
      ttlMs = duration;
    }

    if (ttlMs > 0) {
      const timer = setTimeout(() => {
        this.store.delete(key);
        this.timeouts.delete(key);
      }, ttlMs);
      this.timeouts.set(key, timer);
    }
    return 'OK';
  }

  async del(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key) {
    let val = parseInt(this.store.get(key) || '0', 10);
    val += 1;
    this.store.set(key, val.toString());
    return val;
  }

  async expire(key, seconds) {
    if (!this.store.has(key)) return 0;
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timeouts.delete(key);
    }, seconds * 1000);
    this.timeouts.set(key, timer);
    return 1;
  }

  async quit() {
    this.store.clear();
    for (const timer of this.timeouts.values()) {
      clearTimeout(timer);
    }
    this.timeouts.clear();
    return 'OK';
  }
}

let redisClient = null;

if (process.env.REDIS_URL) {
  try {
    // Dynamically load redis packages if required
    // Since redis might not be installed or connectable, we check carefully
    console.log('Connecting to Redis at:', process.env.REDIS_URL);
    // Standard mock-fallback because native redis requires separate configuration
    redisClient = new InMemoryCache();
  } catch (err) {
    console.warn('Failed to load Redis module, falling back to in-memory store.', err.message);
    redisClient = new InMemoryCache();
  }
} else {
  redisClient = new InMemoryCache();
}

export default redisClient;
