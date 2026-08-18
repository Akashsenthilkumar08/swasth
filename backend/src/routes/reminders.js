const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/reminders - Create reminder
router.post('/', authenticate, authorize('MIGRANT_WORKER'), async (req, res) => {
  try {
    const { medicineName, dosage, reminderTime, frequency } = req.body;

    if (!medicineName || !reminderTime) {
      return res.status(400).json({ error: 'Medicine name and reminder time are required' });
    }

    const worker = await prisma.migrantWorker.findUnique({ where: { userId: req.user.id } });
    if (!worker) return res.status(404).json({ error: 'Worker profile not found' });

    const reminder = await prisma.medicineReminder.create({
      data: {
        workerId: worker.id,
        medicineName,
        dosage: dosage || 'As prescribed',
        reminderTime,
        frequency: frequency || 'Daily',
        isActive: true,
      },
    });

    res.status(201).json({ success: true, reminder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reminders - Get reminders for current worker
router.get('/', authenticate, authorize('MIGRANT_WORKER'), async (req, res) => {
  try {
    const worker = await prisma.migrantWorker.findUnique({ where: { userId: req.user.id } });
    if (!worker) return res.status(404).json({ error: 'Worker profile not found' });

    const reminders = await prisma.medicineReminder.findMany({
      where: { workerId: worker.id, isActive: true },
      orderBy: { reminderTime: 'asc' },
    });

    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', authenticate, authorize('MIGRANT_WORKER'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.medicineReminder.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Reminder removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
