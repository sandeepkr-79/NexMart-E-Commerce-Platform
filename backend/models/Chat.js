import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sources: [{ type: String }], // Cites PDFs, FAQ links, or Product IDs
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const chatSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, index: true },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
