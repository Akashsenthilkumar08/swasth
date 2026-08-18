const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CareConnect Kerala demo data...');

  // ========================
  // USERS
  // ========================
  const workerPassword = await bcrypt.hash('Worker@123', 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const workerUser = await prisma.user.upsert({
    where: { email: 'worker@careconnect.demo' },
    update: {},
    create: {
      email: 'worker@careconnect.demo',
      password: workerPassword,
      role: 'MIGRANT_WORKER',
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@careconnect.demo' },
    update: {},
    create: {
      email: 'doctor@careconnect.demo',
      password: doctorPassword,
      role: 'HEALTHCARE_PROVIDER',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@careconnect.demo' },
    update: {},
    create: {
      email: 'admin@careconnect.demo',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Extra worker users
  const worker2Password = await bcrypt.hash('Worker@123', 10);
  const workerUser2 = await prisma.user.upsert({
    where: { email: 'rajan@careconnect.demo' },
    update: {},
    create: {
      email: 'rajan@careconnect.demo',
      password: worker2Password,
      role: 'MIGRANT_WORKER',
    },
  });

  const workerUser3 = await prisma.user.upsert({
    where: { email: 'priya@careconnect.demo' },
    update: {},
    create: {
      email: 'priya@careconnect.demo',
      password: worker2Password,
      role: 'MIGRANT_WORKER',
    },
  });

  // ========================
  // MIGRANT WORKERS
  // ========================
  let worker = await prisma.migrantWorker.findUnique({ where: { userId: workerUser.id } });
  if (!worker) {
    worker = await prisma.migrantWorker.create({
      data: {
        userId: workerUser.id,
        name: 'Arun Kumar',
        age: 29,
        gender: 'Male',
        phone: '+91 98765 43210',
        currentLocation: 'Kochi',
        homeState: 'Tamil Nadu',
        languages: JSON.stringify(['Tamil', 'Malayalam', 'English']),
        bloodGroup: 'O+',
        allergies: JSON.stringify(['Penicillin', 'Dust']),
        occupation: 'Construction Worker',
      },
    });
  }

  let worker2 = await prisma.migrantWorker.findUnique({ where: { userId: workerUser2.id } });
  if (!worker2) {
    worker2 = await prisma.migrantWorker.create({
      data: {
        userId: workerUser2.id,
        name: 'Rajan Sharma',
        age: 34,
        gender: 'Male',
        phone: '+91 87654 32109',
        currentLocation: 'Thrissur',
        homeState: 'Uttar Pradesh',
        languages: JSON.stringify(['Hindi', 'Malayalam']),
        bloodGroup: 'B+',
        allergies: JSON.stringify(['Sulfa drugs']),
        occupation: 'Factory Worker',
      },
    });
  }

  let worker3 = await prisma.migrantWorker.findUnique({ where: { userId: workerUser3.id } });
  if (!worker3) {
    worker3 = await prisma.migrantWorker.create({
      data: {
        userId: workerUser3.id,
        name: 'Priya Devi',
        age: 26,
        gender: 'Female',
        phone: '+91 76543 21098',
        currentLocation: 'Kozhikode',
        homeState: 'West Bengal',
        languages: JSON.stringify(['Bengali', 'Hindi', 'Malayalam']),
        bloodGroup: 'A+',
        allergies: JSON.stringify(['Latex']),
        occupation: 'Domestic Worker',
      },
    });
  }

  // ========================
  // EMERGENCY CONTACTS
  // ========================
  await prisma.emergencyContact.upsert({
    where: { workerId: worker.id },
    update: {},
    create: {
      workerId: worker.id,
      name: 'Sunita Kumar',
      relationship: 'Spouse',
      phone: '+91 99887 76655',
      address: 'Chennai, Tamil Nadu',
    },
  });

  await prisma.emergencyContact.upsert({
    where: { workerId: worker2.id },
    update: {},
    create: {
      workerId: worker2.id,
      name: 'Ramesh Sharma',
      relationship: 'Brother',
      phone: '+91 88776 65544',
      address: 'Lucknow, Uttar Pradesh',
    },
  });

  await prisma.emergencyContact.upsert({
    where: { workerId: worker3.id },
    update: {},
    create: {
      workerId: worker3.id,
      name: 'Rina Devi',
      relationship: 'Mother',
      phone: '+91 77665 54433',
      address: 'Kolkata, West Bengal',
    },
  });

  // ========================
  // HEALTHCARE PROVIDER
  // ========================
  let provider = await prisma.healthcareProvider.findUnique({ where: { userId: doctorUser.id } });
  if (!provider) {
    provider = await prisma.healthcareProvider.create({
      data: {
        userId: doctorUser.id,
        name: 'Dr. Meera Nair',
        designation: 'General Physician',
        hospital: 'City Care Hospital, Kochi',
        location: 'Kochi',
        licenseNo: 'KL-MED-2021-4567',
        phone: '+91 98765 12345',
      },
    });
  }

  // ========================
  // MEDICAL VISITS
  // ========================
  const existingVisits = await prisma.medicalVisit.findMany({ where: { workerId: worker.id } });
  if (existingVisits.length === 0) {
    await prisma.medicalVisit.createMany({
      data: [
        {
          workerId: worker.id,
          providerId: provider.id,
          visitDate: new Date('2026-05-12'),
          hospital: 'City Clinic, Kochi',
          doctorName: 'Dr. Meera Nair',
          diagnosis: 'Viral Fever',
          symptoms: 'High temperature, body ache, fatigue',
          prescription: 'Paracetamol 500mg, Vitamin C supplements, ORS',
          notes: 'Rest advised for 3 days. Follow up if fever persists.',
          followUpDate: new Date('2026-05-15'),
        },
        {
          workerId: worker.id,
          visitDate: new Date('2026-06-20'),
          hospital: 'Community Health Centre, Ernakulam',
          doctorName: 'Dr. Rajesh Kumar',
          diagnosis: 'General Health Checkup',
          symptoms: 'Routine examination',
          prescription: 'Multivitamins',
          notes: 'BP normal. Blood sugar normal. Overall health satisfactory.',
        },
        {
          workerId: worker.id,
          visitDate: new Date('2026-07-08'),
          hospital: 'Primary Health Centre, Kochi',
          doctorName: 'Dr. Anitha Pillai',
          diagnosis: 'Minor Skin Allergy',
          symptoms: 'Rash on arms, itching',
          prescription: 'Cetirizine 10mg, Calamine lotion',
          notes: 'Avoid contact with dusty environments. Use cotton clothing.',
        },
      ],
    });

    await prisma.medicalVisit.createMany({
      data: [
        {
          workerId: worker2.id,
          visitDate: new Date('2026-04-15'),
          hospital: 'Government Hospital, Thrissur',
          doctorName: 'Dr. Sujatha Menon',
          diagnosis: 'Upper Respiratory Tract Infection',
          symptoms: 'Cough, cold, sore throat',
          prescription: 'Amoxicillin 250mg (Note: Not Sulfa drugs due to allergy), Cough syrup',
          notes: 'Patient has sulfa drug allergy. Prescribed alternative antibiotics.',
        },
        {
          workerId: worker3.id,
          visitDate: new Date('2026-06-05'),
          hospital: 'Kozhikode Medical College',
          doctorName: 'Dr. Pradeep Varma',
          diagnosis: 'Anaemia (Mild)',
          symptoms: 'Fatigue, weakness, dizziness',
          prescription: 'Iron and Folic Acid supplements',
          notes: 'Dietary counselling given. Increase iron-rich food intake.',
        },
      ],
    });
  }

  // ========================
  // VACCINATIONS
  // ========================
  const existingVaccinations = await prisma.vaccination.findMany({ where: { workerId: worker.id } });
  if (existingVaccinations.length === 0) {
    await prisma.vaccination.createMany({
      data: [
        {
          workerId: worker.id,
          vaccineName: 'COVID-19 (Covishield)',
          vaccinationDate: new Date('2021-06-15'),
          hospital: 'PHC Coimbatore',
          batchNo: 'COV-2021-TN-456',
          notes: 'Dose 1 & 2 completed. Booster due.',
        },
        {
          workerId: worker.id,
          vaccineName: 'COVID-19 Booster (Corbevax)',
          vaccinationDate: new Date('2022-03-10'),
          hospital: 'Government Hospital, Kochi',
          batchNo: 'COR-2022-KL-789',
          notes: 'Precautionary dose administered.',
        },
        {
          workerId: worker.id,
          vaccineName: 'Tetanus Toxoid',
          vaccinationDate: new Date('2023-08-22'),
          dueDate: new Date('2033-08-22'),
          hospital: 'City Clinic, Kochi',
          batchNo: 'TT-2023-KL-112',
          notes: 'Valid for 10 years.',
        },
        {
          workerId: worker.id,
          vaccineName: 'Hepatitis B',
          vaccinationDate: new Date('2020-01-10'),
          hospital: 'PHC Coimbatore',
          batchNo: 'HEP-2020-TN-334',
          notes: 'Full course completed (3 doses).',
        },
        {
          workerId: worker2.id,
          vaccineName: 'COVID-19 (Covaxin)',
          vaccinationDate: new Date('2021-07-20'),
          hospital: 'Government Hospital, Thrissur',
          batchNo: 'COVX-2021-KL-567',
          notes: 'Completed 2 doses.',
        },
        {
          workerId: worker3.id,
          vaccineName: 'COVID-19 (Covishield)',
          vaccinationDate: new Date('2021-08-05'),
          hospital: 'Health Centre, Kozhikode',
          batchNo: 'COV-2021-KL-890',
          notes: 'Completed 2 doses.',
        },
      ],
    });
  }

  // ========================
  // MEDICATIONS
  // ========================
  const existingMeds = await prisma.medication.findMany({ where: { workerId: worker.id } });
  if (existingMeds.length === 0) {
    await prisma.medication.createMany({
      data: [
        {
          workerId: worker.id,
          medicineName: 'Cetirizine 10mg',
          dosage: '10mg – 1 tablet',
          frequency: 'Once daily at night',
          startDate: new Date('2026-07-08'),
          endDate: new Date('2026-07-22'),
          prescribedBy: 'Dr. Anitha Pillai',
          isActive: true,
          notes: 'For allergy. Take after food.',
        },
        {
          workerId: worker.id,
          medicineName: 'Vitamin C (500mg)',
          dosage: '500mg – 1 tablet',
          frequency: 'Once daily in morning',
          startDate: new Date('2026-06-20'),
          prescribedBy: 'Dr. Rajesh Kumar',
          isActive: true,
          notes: 'Immunity booster. Continue for 3 months.',
        },
        {
          workerId: worker2.id,
          medicineName: 'Iron & Folic Acid Tablet',
          dosage: '1 tablet',
          frequency: 'Once daily after breakfast',
          startDate: new Date('2026-06-05'),
          prescribedBy: 'Dr. Pradeep Varma',
          isActive: true,
          notes: 'Continue for 90 days.',
        },
      ],
    });
  }

  // ========================
  // LAB REPORTS
  // ========================
  const existingReports = await prisma.labReport.findMany({ where: { workerId: worker.id } });
  if (existingReports.length === 0) {
    await prisma.labReport.createMany({
      data: [
        {
          workerId: worker.id,
          providerId: provider.id,
          reportName: 'Complete Blood Count (CBC)',
          testDate: new Date('2026-06-20'),
          laboratory: 'Metropolis Lab, Kochi',
          results: 'Hemoglobin: 14.2 g/dL, WBC: 6,800 cells/μL, Platelets: 2.1 lakh',
          normalRange: 'Hb: 13-17 g/dL, WBC: 4,500-11,000, Platelets: 1.5-4.5 lakh',
          status: 'NORMAL',
          notes: 'All parameters within normal range.',
        },
        {
          workerId: worker.id,
          reportName: 'Blood Glucose (Fasting)',
          testDate: new Date('2026-06-20'),
          laboratory: 'Metropolis Lab, Kochi',
          results: '94 mg/dL',
          normalRange: '70-100 mg/dL',
          status: 'NORMAL',
          notes: 'Normal fasting glucose.',
        },
        {
          workerId: worker.id,
          reportName: 'Blood Pressure Reading',
          testDate: new Date('2026-07-08'),
          laboratory: 'PHC Kochi',
          results: '118/76 mmHg',
          normalRange: '< 120/80 mmHg',
          status: 'NORMAL',
          notes: 'Normal blood pressure.',
        },
      ],
    });
  }

  // ========================
  // HEALTHCARE FACILITIES
  // ========================
  const existingFacilities = await prisma.healthcareFacility.findMany();
  if (existingFacilities.length === 0) {
    await prisma.healthcareFacility.createMany({
      data: [
        // KOCHI
        { name: 'City Care Hospital', type: 'HOSPITAL', location: 'Kochi', district: 'Ernakulam', address: 'M.G. Road, Kochi, Kerala 682011', phone: '+91 484 234 5678', distance: 1.2, emergency: true, openingHours: '24/7', rating: 4.5 },
        { name: 'Lakeshore Hospital', type: 'HOSPITAL', location: 'Kochi', district: 'Ernakulam', address: 'NH-47, Maradu, Kochi, Kerala 682304', phone: '+91 484 270 1000', distance: 2.8, emergency: true, openingHours: '24/7', rating: 4.7 },
        { name: 'Community Health Centre – Ernakulam', type: 'CLINIC', location: 'Kochi', district: 'Ernakulam', address: 'Vyttila, Ernakulam, Kerala 682019', phone: '+91 484 230 9876', distance: 2.4, emergency: false, openingHours: '8 AM – 8 PM', rating: 4.2 },
        { name: 'PHC Mattancherry', type: 'CLINIC', location: 'Kochi', district: 'Ernakulam', address: 'Mattancherry, Kochi, Kerala 682002', phone: '+91 484 222 3344', distance: 3.5, emergency: false, openingHours: '8 AM – 5 PM', rating: 3.9 },
        { name: 'MedPlus Pharmacy – MG Road', type: 'PHARMACY', location: 'Kochi', district: 'Ernakulam', address: 'MG Road, Kochi, Kerala 682011', phone: '+91 484 444 5555', distance: 0.8, emergency: false, openingHours: '8 AM – 10 PM', rating: 4.3 },
        { name: 'Apollo Pharmacy – Ernakulam', type: 'PHARMACY', location: 'Kochi', district: 'Ernakulam', address: 'Ernakulam Junction, Kochi', phone: '+91 484 333 6666', distance: 1.5, emergency: false, openingHours: '24/7', rating: 4.4 },

        // THRISSUR
        { name: 'Government Medical College Thrissur', type: 'HOSPITAL', location: 'Thrissur', district: 'Thrissur', address: 'Medical College Rd, Thrissur, Kerala 680596', phone: '+91 487 236 0802', distance: 2.1, emergency: true, openingHours: '24/7', rating: 4.3 },
        { name: 'Amala Cancer Hospital', type: 'HOSPITAL', location: 'Thrissur', district: 'Thrissur', address: 'Amala Nagar, Thrissur, Kerala 680555', phone: '+91 487 235 3900', distance: 4.2, emergency: true, openingHours: '24/7', rating: 4.6 },
        { name: 'PHC Thrissur Town', type: 'CLINIC', location: 'Thrissur', district: 'Thrissur', address: 'Thrissur Town, Kerala 680001', phone: '+91 487 233 0011', distance: 1.4, emergency: false, openingHours: '8 AM – 6 PM', rating: 3.8 },
        { name: 'MedPlus Pharmacy – Swaraj Round', type: 'PHARMACY', location: 'Thrissur', district: 'Thrissur', address: 'Swaraj Round, Thrissur, Kerala 680001', phone: '+91 487 222 1111', distance: 1.1, emergency: false, openingHours: '8 AM – 10 PM', rating: 4.2 },

        // KOZHIKODE
        { name: 'Government Medical College Kozhikode', type: 'HOSPITAL', location: 'Kozhikode', district: 'Kozhikode', address: 'Medical College Rd, Kozhikode, Kerala 673008', phone: '+91 495 236 5000', distance: 3.2, emergency: true, openingHours: '24/7', rating: 4.4 },
        { name: 'MIMS Hospital Kozhikode', type: 'HOSPITAL', location: 'Kozhikode', district: 'Kozhikode', address: 'Mini Bypass Road, Kozhikode, Kerala 673016', phone: '+91 495 271 2300', distance: 5.1, emergency: true, openingHours: '24/7', rating: 4.6 },
        { name: 'CHC Kallai', type: 'CLINIC', location: 'Kozhikode', district: 'Kozhikode', address: 'Kallai Road, Kozhikode, Kerala 673003', phone: '+91 495 230 1234', distance: 2.0, emergency: false, openingHours: '8 AM – 8 PM', rating: 4.0 },
        { name: 'Wellcare Pharmacy – Kozhikode', type: 'PHARMACY', location: 'Kozhikode', district: 'Kozhikode', address: 'SM Street, Kozhikode, Kerala 673001', phone: '+91 495 276 5432', distance: 1.3, emergency: false, openingHours: '8 AM – 10 PM', rating: 4.1 },

        // THIRUVANANTHAPURAM
        { name: 'SAT Hospital Thiruvananthapuram', type: 'HOSPITAL', location: 'Thiruvananthapuram', district: 'Thiruvananthapuram', address: 'Medical College Rd, Thiruvananthapuram, Kerala 695011', phone: '+91 471 252 8386', distance: 2.6, emergency: true, openingHours: '24/7', rating: 4.2 },
        { name: 'KIMS Hospital', type: 'HOSPITAL', location: 'Thiruvananthapuram', district: 'Thiruvananthapuram', address: 'Anayara, Thiruvananthapuram, Kerala 695029', phone: '+91 471 241 4141', distance: 4.8, emergency: true, openingHours: '24/7', rating: 4.5 },
        { name: 'PHC Pattom', type: 'CLINIC', location: 'Thiruvananthapuram', district: 'Thiruvananthapuram', address: 'Pattom, Thiruvananthapuram, Kerala 695004', phone: '+91 471 244 5566', distance: 1.8, emergency: false, openingHours: '8 AM – 6 PM', rating: 4.0 },
        { name: 'Jan Aushadhi Pharmacy – TVM', type: 'PHARMACY', location: 'Thiruvananthapuram', district: 'Thiruvananthapuram', address: 'Palayam, Thiruvananthapuram, Kerala 695001', phone: '+91 471 233 7788', distance: 1.0, emergency: false, openingHours: '9 AM – 9 PM', rating: 4.2 },
      ],
    });
  }


  // ========================
  // MEDICINE REMINDERS
  // ========================
  const existingReminders = await prisma.medicineReminder.findMany({ where: { workerId: worker.id } });
  if (existingReminders.length === 0) {
    await prisma.medicineReminder.createMany({
      data: [
        {
          workerId: worker.id,
          medicineName: 'Cetirizine 10mg',
          dosage: '1 tablet',
          reminderTime: '21:00',
          frequency: 'Daily',
          isActive: true,
        },
        {
          workerId: worker.id,
          medicineName: 'Vitamin C 500mg',
          dosage: '1 tablet',
          reminderTime: '08:00',
          frequency: 'Daily',
          isActive: true,
        },
      ],
    });
  }

  // ========================
  // AUDIT LOGS
  // ========================
  const existingAudit = await prisma.auditLog.findMany();
  if (existingAudit.length === 0) {
    await prisma.auditLog.createMany({
      data: [
        {
          userId: workerUser.id,
          action: 'PROFILE_VIEWED',
          resource: 'MigrantWorker',
          resourceId: worker.id,
          details: 'Worker viewed own health profile',
        },
        {
          userId: doctorUser.id,
          action: 'RECORD_ACCESSED',
          resource: 'HealthRecord',
          resourceId: worker.id,
          details: 'Dr. Meera Nair accessed health record for Arun Kumar',
          ipAddress: '192.168.1.100',
        },
        {
          userId: doctorUser.id,
          action: 'CONSULTATION_ADDED',
          resource: 'MedicalVisit',
          resourceId: worker.id,
          details: 'Consultation record added: Viral Fever treatment',
          ipAddress: '192.168.1.100',
        },
        {
          userId: workerUser.id,
          action: 'QR_ACCESSED',
          resource: 'EmergencyQR',
          resourceId: worker.id,
          details: 'Emergency QR code generated and accessed',
        },
        {
          userId: doctorUser.id,
          action: 'REPORT_UPLOADED',
          resource: 'LabReport',
          resourceId: worker.id,
          details: 'CBC report uploaded by Dr. Meera Nair',
          ipAddress: '192.168.1.100',
        },
        {
          userId: adminUser.id,
          action: 'ADMIN_ANALYTICS_VIEWED',
          resource: 'Dashboard',
          details: 'Admin accessed analytics dashboard',
        },
      ],
    });
  }

  console.log('✅ Demo data seeded successfully!');
  console.log('\n📋 DEMO ACCOUNTS:');
  console.log('  👤 Migrant Worker: worker@careconnect.demo / Worker@123');
  console.log('  🏥 Healthcare Provider: doctor@careconnect.demo / Doctor@123');
  console.log('  ⚙️  Admin: admin@careconnect.demo / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
