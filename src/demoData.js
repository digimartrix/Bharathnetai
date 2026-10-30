// Deterministic synthetic seed data. No production, government, or patient records are used.
const regions = [
  ['Tamil Nadu', 'Chennai'], ['Karnataka', 'Bengaluru'], ['Delhi', 'New Delhi'], ['Uttar Pradesh', 'Lucknow'],
  ['Kerala', 'Kochi'], ['Gujarat', 'Ahmedabad'], ['Maharashtra', 'Pune'], ['Telangana', 'Hyderabad'],
  ['Andhra Pradesh', 'Visakhapatnam'], ['Rajasthan', 'Jaipur'], ['West Bengal', 'Kolkata']
];
const names = ['Bharat General Hospital', 'Aarogya City Hospital', 'National Care Medical Centre', 'Jan Seva Medical Institute', 'Coastal Life Sciences Hospital', 'Western Regional Care', 'Sanjeevani Medical Campus', 'Vistara Health Institute', 'Civic Wellness Hospital', 'Prana Advanced Care'];
const types = ['Tertiary', 'Multi-specialty', 'Teaching', 'District hospital'];

export const hospitals = Array.from({ length: 30 }, (_, index) => {
  const [region, city] = regions[index % regions.length];
  const beds = 360 + ((index * 137) % 620);
  const utilization = 0.58 + ((index * 7) % 31) / 100;
  const icu = Math.round(beds * (0.08 + (index % 4) * 0.02));
  const available = Math.max(5, Math.round(icu * (1 - utilization) * 0.58));
  const status = utilization > 0.84 ? 'Critical' : utilization > 0.74 ? 'Warning' : 'Normal';
  return {
    id: `BHN-${String(index + 1).padStart(3, '0')}`,
    name: `${names[index % names.length]}${index >= names.length ? ` · ${city}` : ''}`,
    city, state: region, district: `${city} district`, type: types[index % types.length], beds,
    occupied: Math.round(beds * utilization), icu, available, doctors: 68 + ((index * 19) % 166), status,
    lastSync: `${12 + (index % 48)} sec ago`
  };
});

export const bloodBanks = ['Chennai Central Blood Services', 'Bengaluru Voluntary Blood Bank', 'Delhi Regional Blood Centre', 'Kochi Lifeline Bank', 'Pune Community Blood Services'].map((name, index) => ({ id: `BB-${String(index + 1).padStart(3, '0')}`, name, state: regions[index][0], units: 680 + index * 240, threshold: 420, status: index === 3 ? 'Low' : 'Normal' }));

const medicineNames = ['Paracetamol 500mg', 'Insulin glargine', 'Ceftriaxone', 'Amoxicillin', 'Azithromycin', 'Salbutamol', 'Metformin 500mg', 'ORS sachets', 'Hydroxyurea', 'Amlodipine', 'Atorvastatin', 'Heparin', 'Dexamethasone', 'Pantoprazole', 'Artemether'];
export const medicines = Array.from({ length: 30 }, (_, index) => ({ id: `MED-${String(index + 1).padStart(3, '0')}`, name: `${medicineNames[index % medicineNames.length]}${index >= medicineNames.length ? ` · batch ${index + 1}` : ''}`, category: ['Analgesic', 'Antibiotic', 'Endocrine', 'Emergency'][index % 4], stock: 620 + ((index * 731) % 24000), dailyUse: 80 + ((index * 29) % 450), reorderLevel: 420, supplier: ['Cura Supply Co.', 'MedAxis Logistics', 'Aarogya Distributors'][index % 3] })).map(item => ({ ...item, days: Math.max(2, Math.round(item.stock / item.dailyUse)), status: item.stock / item.dailyUse < 4 ? 'Critical' : item.stock / item.dailyUse < 8 ? 'Low' : 'Healthy' }));

export const ambulances = Array.from({ length: 50 }, (_, index) => ({ id: `AMB-${String(index + 1).padStart(3, '0')}`, location: `${regions[index % regions.length][1]} · ${2 + (index % 9)}.${index % 10} km`, status: ['Available', 'On duty', 'Emergency', 'Maintenance'][index % 4], hospital: hospitals[index % hospitals.length].name, eta: index % 4 === 3 ? '—' : `${4 + (index % 18)} min` }));

export const equipment = Array.from({ length: 100 }, (_, index) => ({ id: `${['VNT', 'MRI', 'CT', 'OXY', 'ECG'][index % 5]}-${String(index + 1).padStart(3, '0')}`, type: ['Ventilator', 'MRI', 'CT Scanner', 'Oxygen Generator', 'ECG'][index % 5], hospital: hospitals[index % hospitals.length].name, sensor: index % 17 === 0 ? '72.4°C' : 'Normal', risk: index % 17 === 0 ? 'High risk' : index % 5 === 0 ? 'Medium risk' : 'Low risk' }));

export const integrations = [
  { name: 'Hospital API', type: 'Facility capacity', status: 'Connected', sync: '42 sec ago', records: '1.84m' },
  { name: 'Laboratory API', type: 'Diagnostics exchange', status: 'Connected', sync: '2 min ago', records: '428k' },
  { name: 'Pharmacy API', type: 'Inventory signals', status: 'Degraded', sync: '5 min ago', records: '92k' },
  { name: 'IoT Gateway', type: 'Equipment telemetry', status: 'Connected', sync: '18 sec ago', records: '6.2m' }
];

export const seedSummary = { seededAt: '26 Aug 2026 · 21:48 IST', hospitals: hospitals.length, beds: hospitals.reduce((sum, hospital) => sum + hospital.beds, 0), icuBeds: hospitals.reduce((sum, hospital) => sum + hospital.icu, 0), bloodBanks: bloodBanks.length, medicines: medicines.length, ambulances: ambulances.length, equipment: equipment.length };
