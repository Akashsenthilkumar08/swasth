const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/healthcare/nearby?location=Kochi&type=HOSPITAL
router.get('/nearby', async (req, res) => {
  try {
    const { location, type } = req.query;

    const where = {};
    if (location) where.location = { contains: location };
    if (type) where.type = type;
    where.isActive = true;

    const facilities = await prisma.healthcareFacility.findMany({
      where,
      orderBy: { distance: 'asc' },
    });

    res.json({
      location: location || 'All',
      type: type || 'All',
      count: facilities.length,
      facilities,
      note: '⚠️ Demo data. Distances and availability are approximate.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/healthcare/pharmacy/nearby?location=Kochi
router.get('/pharmacy/nearby', async (req, res) => {
  try {
    const { location } = req.query;

    const facilities = await prisma.healthcareFacility.findMany({
      where: {
        type: 'PHARMACY',
        ...(location ? { location: { contains: location } } : {}),
        isActive: true,
      },
      orderBy: { distance: 'asc' },
    });

    res.json({ facilities, note: '⚠️ Demo data.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/healthcare/emergency?location=Kochi
router.get('/emergency', async (req, res) => {
  try {
    const { location } = req.query;

    const facilities = await prisma.healthcareFacility.findMany({
      where: {
        emergency: true,
        ...(location ? { location: { contains: location } } : {}),
        isActive: true,
      },
      orderBy: { distance: 'asc' },
    });

    res.json({ facilities, note: '⚠️ Demo data. For real emergencies call 108.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
