const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Fetch role-specific profile
    let profile = null;
    if (user.role === 'MIGRANT_WORKER') {
      profile = await prisma.migrantWorker.findUnique({
        where: { userId: user.id },
        include: { emergencyContact: true },
      });
    } else if (user.role === 'HEALTHCARE_PROVIDER') {
      profile = await prisma.healthcareProvider.findUnique({
        where: { userId: user.id },
      });
    }

    await logAudit(user.id, 'LOGIN', 'Auth', null, `User logged in: ${user.email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await logAudit(decoded.userId, 'LOGOUT', 'Auth', null, 'User logged out');
      } catch (_) {}
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.json({ success: true });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    let profile = null;
    if (user.role === 'MIGRANT_WORKER') {
      profile = await prisma.migrantWorker.findUnique({
        where: { userId: user.id },
        include: { emergencyContact: true },
      });
    } else if (user.role === 'HEALTHCARE_PROVIDER') {
      profile = await prisma.healthcareProvider.findUnique({ where: { userId: user.id } });
    }

    res.json({ id: user.id, email: user.email, role: user.role, profile });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
