const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/provider/workers - Search workers
router.get('/workers', authenticate, authorize('HEALTHCARE_PROVIDER', 'ADMIN'), async (req, res) => {
  try {
    const { search } = req.query;
    const workers = await prisma.migrantWorker.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { currentLocation: { contains: search } },
        ],
      } : {},
      include: { emergencyContact: true },
      orderBy: { name: 'asc' },
    });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/provider/reports/:workerId - Upload lab report
router.post('/reports/:workerId', authenticate, authorize('HEALTHCARE_PROVIDER'), async (req, res) => {
  try {
    const { workerId } = req.params;
    const { reportName, testDate, laboratory, results, normalRange, status, notes } = req.body;

    const provider = await prisma.healthcareProvider.findUnique({ where: { userId: req.user.id } });

    const report = await prisma.labReport.create({
      data: {
        workerId,
        providerId: provider?.id,
        reportName,
        testDate: testDate ? new Date(testDate) : new Date(),
        laboratory: laboratory || 'Hospital Lab',
        results,
        normalRange,
        status: status || 'NORMAL',
        notes,
      },
    });

    await logAudit(req.user.id, 'REPORT_UPLOADED', 'LabReport', report.id,
      `Lab report uploaded: ${reportName} for worker ${workerId}`, req.ip);

    res.status(201).json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
