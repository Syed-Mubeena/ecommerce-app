const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ── Models ──────────────────────────────────────────
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}));

const Product = mongoose.model('Product', new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  category: String,
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  status: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}));

// ── Auth middleware ──────────────────────────────────
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin access required' });
  next();
};

// ── Auth routes ──────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role === 'admin' ? 'admin' : 'user' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, name: user.name, role: user.role });
  } catch (e) {
    res.status(400).json({ msg: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, name: user.name, role: user.role });
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

// ── Product routes ───────────────────────────────────
app.get('/api/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

app.post('/api/products', auth, adminOnly, async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

app.put('/api/products/:id', auth, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
});

app.delete('/api/products/:id', auth, adminOnly, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Deleted' });
});

// ── Order routes ──────────────────────────────────────
app.post('/api/orders', auth, async (req, res) => {
  const order = await Order.create({ ...req.body, user: req.user.id });
  res.json(order);
});

app.get('/api/orders/my', auth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

app.get('/api/orders', auth, adminOnly, async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

app.put('/api/orders/:id', auth, adminOnly, async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(order);
});

// ── Start ────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.log(err));