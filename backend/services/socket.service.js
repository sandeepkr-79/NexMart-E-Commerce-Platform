import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance = null;
const activeUsers = new Map(); // Maps socket.id -> userId

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Set up user rooms
    socket.on('setup', (userData) => {
      if (userData && userData._id) {
        socket.join(`user_${userData._id}`);
        activeUsers.set(socket.id, userData._id);
        console.log(`User ${userData._id} joined room user_${userData._id}`);
        
        if (userData.role === 'seller') {
          socket.join(`seller_${userData._id}`);
          console.log(`Seller joined room seller_${userData._id}`);
        } else if (userData.role === 'admin') {
          socket.join('admin');
          console.log('Admin joined room admin');
        }
        
        socket.emit('connected');
      }
    });

    socket.on('disconnect', () => {
      const userId = activeUsers.get(socket.id);
      activeUsers.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id} (User: ${userId})`);
    });
  });

  return ioInstance;
};

// Send real-time notification to a user
export const sendNotificationToUser = (userId, type, message, link = '') => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('notification', {
      type,
      message,
      link,
      createdAt: new Date()
    });
  }
};

// Send real-time notification to a seller
export const sendNotificationToSeller = (sellerId, type, message, link = '') => {
  if (ioInstance) {
    ioInstance.to(`seller_${sellerId}`).emit('notification', {
      type,
      message,
      link,
      createdAt: new Date()
    });
  }
};

// Send notification to all admins
export const sendNotificationToAdmin = (type, message, link = '') => {
  if (ioInstance) {
    ioInstance.to('admin').emit('notification', {
      type,
      message,
      link,
      createdAt: new Date()
    });
  }
};

// Generic event emitter
export const emitEvent = (room, event, data) => {
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
  }
};
