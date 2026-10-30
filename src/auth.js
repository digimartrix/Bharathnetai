// Frontend-only demo authentication. Production auth belongs on a server with JWT, bcrypt, and a database.
const demoUsers = [
  { email: 'admin@bharathealthnet.ai', name: 'Dr. Meera Iyer', role: 'Super Admin', initials: 'MI', passwordHash: 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7' },
  { email: 'authority@bharathealthnet.ai', name: 'Arjun Rao', role: 'Health Authority', initials: 'AR', passwordHash: '331ba2174994e76c3fa703b4adc8837b9c82afe3f4488685377609bf2dfc7173' },
  { email: 'hospital@bharathealthnet.ai', name: 'Priya Menon', role: 'Hospital Administrator', initials: 'PM', passwordHash: '98a96b20e295c94e840c0ff1f24060c301d5e2410cb4c1af23847147736e9d73' },
  { email: 'analyst@bharathealthnet.ai', name: 'Kabir Shah', role: 'Healthcare Analyst', initials: 'KS', passwordHash: 'a1205a5c10b5f96929efd9230890b238f3ba07b76641d8b96ac814eef869d8a5' }
];

export const demoAccounts = demoUsers.map(({ email, name, role, initials }) => ({ email, name, role, initials }));

const access = {
  'Super Admin': ['dashboard', 'network', 'hospitals', 'beds', 'blood', 'medicines', 'ambulances', 'equipment', 'ai', 'resources', 'emergency', 'analytics', 'alerts', 'interop', 'audit', 'health', 'settings'],
  'Health Authority': ['dashboard', 'network', 'hospitals', 'beds', 'blood', 'medicines', 'ambulances', 'equipment', 'ai', 'resources', 'emergency', 'analytics', 'alerts', 'interop', 'audit', 'health'],
  'Hospital Administrator': ['dashboard', 'hospitals', 'beds', 'blood', 'medicines', 'equipment', 'alerts', 'health'],
  'Healthcare Analyst': ['dashboard', 'network', 'ai', 'analytics', 'alerts', 'interop'],
  'Medical Professional': ['dashboard', 'beds', 'blood', 'ambulances', 'equipment', 'alerts']
};

async function hashPassword(password) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function authenticate(email, password) {
  const user = demoUsers.find(candidate => candidate.email === email.trim().toLowerCase());
  if (!user || await hashPassword(password) !== user.passwordHash) return null;
  return createSession(user);
}

export function demoLogin(email) {
  const user = demoUsers.find(candidate => candidate.email === email.trim().toLowerCase());
  return user ? createSession(user) : null;
}

function createSession(user) { return { email: user.email, name: user.name, role: user.role, initials: user.initials, loginAt: new Date().toISOString(), accessMode: 'demo' }; }

export function canAccess(role, module) { return Boolean(access[role]?.includes(module)); }
export function roleModules(role) { return access[role] || []; }
