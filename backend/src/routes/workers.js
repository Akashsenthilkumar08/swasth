const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/workers/me - Current worker profile
router.get('/me', authenticate, authorize('MIGRANT_WORKER'), async (req, res) => {
  try {
    const worker = await prisma.migrantWorker.findUnique({
      where: { userId: req.user.id },
      include: { emergencyContact: true },
    });
    if (!worker) return res.status(404).json({ error: 'Worker profile not found' });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/:id - Get worker by ID (provider or admin)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Workers can only see their own profile
    if (req.user.role === 'MIGRANT_WORKER') {
      const worker = await prisma.migrantWorker.findUnique({ where: { userId: req.user.id } });
      if (!worker || worker.id !== id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const worker = await prisma.migrantWorker.findUnique({
      where: { id },
      include: { emergencyContact: true },
    });

    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    if (req.user.role === 'HEALTHCARE_PROVIDER') {
      const provider = await prisma.healthcareProvider.findUnique({ where: { userId: req.user.id } });
      await logAudit(req.user.id, 'RECORD_ACCESSED', 'MigrantWorker', id,
        `${provider?.name || 'Provider'} accessed worker profile`, req.ip);
    }

    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers - List all workers (admin/provider)
router.get('/', authenticate, authorize('HEALTHCARE_PROVIDER', 'ADMIN'), async (req, res) => {
  try {
    const { search } = req.query;
    const workers = await prisma.migrantWorker.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { currentLocation: { contains: search } },
        ],
      } : {},
      include: { emergencyContact: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workers/:id/profile - Update worker profile
router.put('/:id/profile', authenticate, authorize('MIGRANT_WORKER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'MIGRANT_WORKER') {
      const worker = await prisma.migrantWorker.findUnique({ where: { userId: req.user.id } });
      if (!worker || worker.id !== id) return res.status(403).json({ error: 'Access denied' });
    }

    const { name, age, gender, phone, currentLocation, occupation, bloodGroup, allergies } = req.body;

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = parseInt(age);
    if (gender !== undefined) updateData.gender = gender;
    if (phone !== undefined) updateData.phone = phone;
    if (currentLocation !== undefined) updateData.currentLocation = currentLocation;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (allergies !== undefined) updateData.allergies = typeof allergies === 'string' ? allergies : JSON.stringify(allergies);

    const updated = await prisma.migrantWorker.update({
      where: { id },
      data: updateData,
    });

    await logAudit(req.user.id, 'PROFILE_UPDATED', 'MigrantWorker', id, 'Profile information updated');
    res.json({ success: true, worker: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/:id/health-record
router.get('/:id/health-record', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'MIGRANT_WORKER') {
      const worker = await prisma.migrantWorker.findUnique({ where: { userId: req.user.id } });
      if (!worker || worker.id !== id) return res.status(403).json({ error: 'Access denied' });
    }

    const [worker, visits, vaccinations, medications, labReports] = await Promise.all([
      prisma.migrantWorker.findUnique({ where: { id }, include: { emergencyContact: true } }),
      prisma.medicalVisit.findMany({ where: { workerId: id }, orderBy: { visitDate: 'desc' } }),
      prisma.vaccination.findMany({ where: { workerId: id }, orderBy: { dateAdministered: 'desc' } }),
      prisma.medication.findMany({ where: { workerId: id }, orderBy: { startDate: 'desc' } }),
      prisma.labReport.findMany({ where: { workerId: id }, orderBy: { reportDate: 'desc' } }),
    ]);

    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    res.json({
      worker,
      visits,
      vaccinations,
      medications,
      labReports,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/:id/visits
router.get('/:id/visits', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const visits = await prisma.medicalVisit.findMany({
      where: { workerId: id },
      include: { provider: true },
      orderBy: { visitDate: 'desc' },
    });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workers/:id/visits - Add Doctors Visit Record
router.post('/:id/visits', authenticate, authorize('HEALTHCARE_PROVIDER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hospital,
      doctorName,
      doctorPhone,
      doctorAddress,
      diagnosis,
      symptoms,
      prescription,
      notes,
      visitDate,
      pregnant,
      nursing,
      phoneMobile,
      phoneHome,
      phoneWork,
      patientAddress,
      altContactName,
      altContactPhone,
      altContactAddress,
      concerns,
      appointmentDate,
      appointmentTime,
      insuranceName,
      insurancePhone,
      insuranceId,
      insuranceAddress
    } = req.body;

    const provider = await prisma.healthcareProvider.findUnique({ where: { userId: req.user.id } });

    const doctorVisitData = {
      isDoctorVisitRecord: true,
      pregnant: pregnant || 'No',
      nursing: nursing || 'No',
      phoneMobile: phoneMobile || '',
      phoneHome: phoneHome || '',
      phoneWork: phoneWork || '',
      patientAddress: patientAddress || '',
      altContact: { name: altContactName || '', phone: altContactPhone || '', address: altContactAddress || '' },
      concerns: concerns || symptoms || '',
      appointmentDetails: { date: appointmentDate || visitDate || '', time: appointmentTime || '', notes: notes || '' },
      doctorDetails: { name: doctorName || provider?.name || 'Dr. Medical Officer', phone: doctorPhone || provider?.phone || '', address: doctorAddress || hospital || provider?.hospital || '' },
      insuranceDetails: { name: insuranceName || '', phone: insurancePhone || '', idNumber: insuranceId || '', address: insuranceAddress || '' },
      diagnosisAdvice: diagnosis || 'General Consultation'
    };

    const visit = await prisma.medicalVisit.create({
      data: {
        workerId: id,
        providerId: provider?.id,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        hospital: hospital || doctorAddress || provider?.hospital || 'Healthcare Centre',
        doctorName: doctorName || provider?.name || 'Medical Officer',
        diagnosis: diagnosis || 'Doctor Consultation',
        symptoms: concerns || symptoms || 'Routine Checkup',
        prescription: prescription || '',
        notes: JSON.stringify(doctorVisitData),
      },
    });

    await logAudit(req.user.id, 'CONSULTATION_ADDED', 'MedicalVisit', visit.id,
      `Doctors Visit Record added for worker ${id}: ${diagnosis}`, req.ip);

    res.status(201).json({ success: true, visit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/:id/vaccinations
router.get('/:id/vaccinations', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const vaccinations = await prisma.vaccination.findMany({
      where: { workerId: id },
      orderBy: { dateAdministered: 'desc' },
    });
    res.json(vaccinations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/:id/medications
router.get('/:id/medications', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const medications = await prisma.medication.findMany({
      where: { workerId: id },
      orderBy: { startDate: 'desc' },
    });
    res.json(medications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/:id/emergency - Emergency QR data
router.get('/:id/emergency', async (req, res) => {
  try {
    const { id } = req.params;
    const [worker, visits, vaccinations, medications, labReports, healthDocuments] = await Promise.all([
      prisma.migrantWorker.findUnique({
        where: { id },
        include: { emergencyContact: true },
      }),
      prisma.medicalVisit.findMany({
        where: { workerId: id },
        include: { provider: true },
        orderBy: { visitDate: 'desc' },
      }),
      prisma.vaccination.findMany({
        where: { workerId: id },
        orderBy: { dateAdministered: 'desc' },
      }),
      prisma.medication.findMany({
        where: { workerId: id },
        orderBy: { startDate: 'desc' },
      }),
      prisma.labReport.findMany({
        where: { workerId: id },
        orderBy: { reportDate: 'desc' },
      }),
      prisma.healthDocument.findMany({
        where: { workerId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    // Log QR access even without auth
    const firstUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (firstUser) {
      await logAudit(firstUser.id, 'QR_EMERGENCY_ACCESS', 'EmergencyQR', id,
        `Emergency QR accessed for ${worker.name}`, req.ip);
    }

    let parsedAllergies = [];
    try {
      parsedAllergies = typeof worker.allergies === 'string' ? JSON.parse(worker.allergies) : (worker.allergies || []);
    } catch (e) {
      parsedAllergies = [worker.allergies].filter(Boolean);
    }

    res.json({
      id: worker.id,
      uniqueCode: worker.uniqueCode || worker.id.substring(0, 8).toUpperCase(),
      name: worker.name,
      age: worker.age,
      gender: worker.gender,
      phone: worker.phone,
      currentLocation: worker.currentLocation,
      homeState: worker.homeState,
      occupation: worker.occupation,
      bloodGroup: worker.bloodGroup,
      allergies: parsedAllergies,
      emergencyContact: worker.emergencyContact,
      medicalVisits: visits,
      vaccinations: vaccinations,
      medications: medications,
      labReports: labReports,
      healthDocuments: healthDocuments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

