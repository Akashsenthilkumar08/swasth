const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/analytics
router.get('/analytics', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const [
      totalWorkers,
      activeWorkers,
      totalVisits,
      totalVaccinations,
      totalFacilities,
      totalReminders,
      recentAuditLogs,
      workersByLocation,
      visitsByMonth,
    ] = await Promise.all([
      prisma.migrantWorker.count(),
      prisma.migrantWorker.count({ where: { isActive: true } }),
      prisma.medicalVisit.count(),
      prisma.vaccination.count(),
      prisma.healthcareFacility.count(),
      prisma.medicineReminder.count({ where: { isActive: true } }),
      prisma.auditLog.findMany({
        include: { user: { select: { email: true, role: true } } },
        orderBy: { timestamp: 'desc' },
        take: 20,
      }),
      prisma.migrantWorker.groupBy({
        by: ['currentLocation'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.medicalVisit.findMany({
        select: { visitDate: true },
        orderBy: { visitDate: 'desc' },
        take: 50,
      }),
    ]);

    await logAudit(req.user.id, 'ADMIN_ANALYTICS_VIEWED', 'Dashboard', null, 'Admin viewed analytics');

    res.json({
      summary: {
        totalWorkers,
        activeWorkers,
        totalVisits,
        totalVaccinations,
        totalFacilities,
        activeReminders: totalReminders,
        emergencyQrAccesses: recentAuditLogs.filter(l => l.action === 'QR_EMERGENCY_ACCESS').length,
      },
      workersByLocation,
      recentAuditLogs,
      visitsByMonth,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticate, authorize('ADMIN', 'HEALTHCARE_PROVIDER'), async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { email: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
