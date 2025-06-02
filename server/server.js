const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://aminems2002:X5SrzzhVRDnbIHWi@cluster0.e3q0jkg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0' || 'mongodb://localhost:27017/chatterbox')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: {
    text: { type: String },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    const savedUser = await user.save();

    // Create JWT
    const token = jwt.sign(
      { _id: savedUser._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    const userForClient = {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      avatar: savedUser.avatar,
      createdAt: savedUser.createdAt
    };

    res.status(201).json({ user: userForClient, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    const userForClient = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt
    };

    res.status(200).json({ user: userForClient, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/avatar', authenticateToken, async (req, res) => {
  try {
    // In a real app, you'd handle file upload here
    // For demo purposes, we'll just update with a dummy URL
    const avatarUrl = `https://i.pravatar.cc/150?u=${req.user._id}`;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');
    
    res.json({ success: true, avatarUrl, user: updatedUser });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Conversation Routes
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching conversations for user:', req.user._id);
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'name email avatar')
    .sort({ updatedAt: -1 });
    
    res.json(conversations);
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Conversation Routes
app.get('/api/conversations/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching conversations details:', req.user._id);
    const conversationId = req.params.id;
    const conversations = await Conversation.findById(conversationId)
    .populate('participants', 'name email avatar')
    .sort({ updatedAt: -1 });
    
    res.json(conversations);
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.body;
    
    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] }
    }).populate('participants', 'name email avatar');
    
    if (existingConversation) {
      return res.json(existingConversation);
    }
    
    // Create new conversation
    const newConversation = new Conversation({
      participants: [req.user._id, participantId]
    });
    
    const savedConversation = await newConversation.save();
    await savedConversation.populate('participants', 'name email avatar');
    
    res.status(201).json(savedConversation);
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Message Routes
app.get('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    // Verify user is part of the conversation
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }
    
    // Get messages
    const messages = await Message.find({ conversation: req.params.conversationId })
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const { conversationId } = req.params;
    
    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }
    
    // Create new message
    const newMessage = new Message({
      conversation: conversationId,
      sender: req.user._id,
      text
    });
    
    const savedMessage = await newMessage.save();
    
    // Update conversation with last message
    conversation.lastMessage = {
      text,
      sender: req.user._id,
      read: false,
      createdAt: new Date()
    };
    conversation.updatedAt = new Date();
    
    await conversation.save();
    
    // Emit message to socket.io
    io.to(conversationId).emit('message', savedMessage);
    
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Create message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/conversations/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Update all unread messages in this conversation sent by the other user
    await Message.updateMany(
      { 
        conversation: conversationId, 
        sender: { $ne: req.user._id },
        read: false 
      },
      { read: true }
    );
    
    // Update conversation's last message read status if the current user didn't send it
    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.lastMessage && conversation.lastMessage.sender.toString() !== req.user._id.toString()) {
      conversation.lastMessage.read = true;
      await conversation.save();
    }
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join conversation room
  socket.on('join', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation: ${conversationId}`);
  });
  
  // Leave conversation room
  socket.on('leave', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User left conversation: ${conversationId}`);
  });
  
  // User typing indicator
  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('typing', {
      user: data.user,
      isTyping: data.isTyping
    });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});