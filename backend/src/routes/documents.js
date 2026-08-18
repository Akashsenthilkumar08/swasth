const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// =============================================
// MULTER STORAGE CONFIGURATION
// Supports: PDF, JPG, PNG, WebP
// Max size: 10 MB
// =============================================
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const worker = await prisma.migrantWorker.findUnique({ where: { userId: req.user.id } });
    const folder = worker ? worker.id : req.user.id;
    const workerDir = path.join(UPLOADS_DIR, folder);
    if (!fs.existsSync(workerDir)) fs.mkdirSync(workerDir, { recursive: true });
    req._workerId = worker?.id || null;
    req._uploadFolder = folder;
    cb(null, workerDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files (JPG, PNG, WebP) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// =============================================
// HELPERS
// =============================================
async function resolveWorkerId(user) {
  if (user.role !== 'MIGRANT_WORKER') return null;
  const worker = await prisma.migrantWorker.findUnique({ where: { userId: user.id } });
  return worker?.id || null;
}

// =============================================
// ROUTES
// =============================================

/**
 * POST /api/documents/upload
 * Upload a health document for the logged-in worker
 * Form fields: document (file), category, description
 */
router.post('/upload', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Only migrant workers can upload
    if (req.user.role !== 'MIGRANT_WORKER') {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Only migrant workers can upload documents.' });
    }

    const workerId = req._workerId;
    if (!workerId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Worker profile not found.' });
    }

    const { category = 'GENERAL', description = '' } = req.body;

    // Public URL via Express static
    const fileUrl = `http://localhost:3001/uploads/${req._uploadFolder}/${req.file.filename}`;

    const doc = await prisma.healthDocument.create({
      data: {
        workerId,
        fileName:     req.file.filename,
        originalName: req.file.originalname,
        mimeType:     req.file.mimetype,
        fileSize:     req.file.size,
        fileUrl,
        category,
        description: description || null,
      },
    });

    res.status(201).json({ message: 'Document uploaded successfully', document: doc });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

/**
 * GET /api/documents
 * List all documents for the logged-in worker
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const workerId = await resolveWorkerId(req.user);
    if (!workerId) return res.status(403).json({ error: 'Access denied' });

    const docs = await prisma.healthDocument.findMany({
      where: { workerId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/documents/worker/:workerId
 * List docs for a specific worker — provider/admin only
 */
router.get('/worker/:workerId', authenticate, async (req, res) => {
  try {
    if (!['HEALTHCARE_PROVIDER', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const docs = await prisma.healthDocument.findMany({
      where: { workerId: req.params.workerId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document (owner or admin)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doc = await prisma.healthDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const workerId = await resolveWorkerId(req.user);
    if (doc.workerId !== workerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this document' });
    }

    // Find and remove physical file
    const workerDir = path.join(UPLOADS_DIR, doc.workerId);
    const filePath = path.join(workerDir, doc.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.healthDocument.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
