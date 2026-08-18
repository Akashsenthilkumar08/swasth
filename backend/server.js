require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// ========================
// MIDDLEWARE
// ========================
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'null', '*'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static (simulates cloud storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========================
// ROUTES
// ========================
const authRoutes = require('./src/routes/auth');
const workerRoutes = require('./src/routes/workers');
const healthcareRoutes = require('./src/routes/healthcare');
const reminderRoutes = require('./src/routes/reminders');
const adminRoutes = require('./src/routes/admin');
const chatbotRoutes = require('./src/routes/chatbot');
const providerRoutes = require('./src/routes/provider');
const documentRoutes = require('./src/routes/documents');

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/healthcare', healthcareRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/documents', documentRoutes);

// ========================
// HEALTH CHECK
// ========================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Swasth API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ========================
// ERROR HANDLER
// ========================
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong',
  });
});

// ========================
// 404 HANDLER
// ========================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
  console.log('\n🚀 Swasth Backend Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔒 JWT Auth: Enabled`);
  console.log(`💾 Database: SQLite via Prisma`);
  console.log('\nDemo Accounts:');
  console.log('  worker@careconnect.demo / Worker@123');
  console.log('  doctor@careconnect.demo / Doctor@123');
  console.log('  admin@careconnect.demo / Admin@123\n');
});

module.exports = app;
