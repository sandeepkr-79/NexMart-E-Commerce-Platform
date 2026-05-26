# NexMart E‑Commerce Platform

## Overview
A full‑stack MERN marketplace with:
- **Admin** and **Seller** dashboards
- Cart, coupons, COD & Razorpay checkout
- Order lifecycle (placed → packed → shipped → delivered)
- New "Delivered → Paid" automation
- Real‑time notifications via Socket.io

## Prerequisites
- Node.js 20+ (Windows)
- MongoDB instance (local or Atlas)
- `cmd /c` wrapper required for npm scripts on this machine

## Getting Started
```bash
# Clone repo (if not already)
git clone <repo‑url> .

# Install dependencies for both sides
npm install          # installs root (if any)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Environment Variables
Create a `.env` in **backend** with:
```
MONGODB_URI=mongodb://localhost:27017/nexmart
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```
Create a `.env` in **frontend** (use Vite defaults) for API base URL if needed.

## Running Locally
```bash
# Start backend
cmd /c npm run dev --workspace=backend
# In a new terminal, start frontend
cmd /c npm run dev --workspace=frontend
```
Open `http://localhost:5173`.

## Building for Production
```bash
# Backend bundle
cd backend && npm run build && cd ..
# Frontend static build
cd frontend && npm run build && cd ..
# Serve static files via your preferred server (e.g., nginx, pm2)
```

## Deployment Checklist
- Set environment variables on the host
- Use a process manager (PM2, Docker) for Node services
- Configure HTTPS and domain
- Enable CORS for the frontend URL
- Secure Razorpay webhook endpoint

## License
MIT © 2024‑2026 NexMart Team
```
