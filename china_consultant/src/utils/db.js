import { normalizeInvoice } from './invoice';

const DEFAULT_USERS = [
  { email: 'admin@cvs.com', password: 'admin123', name: 'Rajesh Sharma', phone: '+977 985-1014899', role: 'admin', status: 'active' },
  { email: 'employee@cvs.com', password: 'employee123', name: 'Anita Thapa', phone: '+977 984-2203344', role: 'employee', status: 'active' },
  { email: 'customer@cvs.com', password: 'customer123', name: 'Ram Bahadur', phone: '+977 981-7755331', role: 'customer', status: 'active' },
];

const EMPLOYEE_REGISTRATION_CODE = '16923';
const ADMIN_REGISTRATION_CODE = '27034';
const ADMIN_RESET_STORE_KEY = 'cvs-admin-reset-codes';

const DEFAULT_INVOICES = [
  { id: 'INV-2081-001', client: 'Ram Bahadur Thapa', passport: 'NP12345678', country: 'China', visaType: 'Tourist (L)', amount: 15000, status: 'paid', date: '2081-01-15', email: 'ram@email.com', notes: 'Urgent China Tourist Visa processing.' },
  { id: 'INV-2081-002', client: 'Sita Devi Sharma', passport: 'NP87654321', country: 'Japan', visaType: 'Student', amount: 18000, status: 'pending', date: '2081-02-03', email: 'sita@email.com', notes: 'Japan Student Visa document checking.' },
  { id: 'INV-2081-003', client: 'Hari Prasad KC', passport: 'NP11223344', country: 'China', visaType: 'Business (M)', amount: 20000, status: 'paid', date: '2081-02-20', email: 'hari@email.com', notes: 'China Business Visa submission.' },
  { id: 'INV-2081-004', client: 'Gita Adhikari', passport: 'NP55667788', country: 'South Korea', visaType: 'Tourist', amount: 12000, status: 'draft', date: '2081-03-10', email: 'gita@email.com', notes: 'Drafting South Korea Tourist documents.' },
  { id: 'INV-2081-005', client: 'Bikash Gurung', passport: 'NP99887766', country: 'China', visaType: 'Student (X)', amount: 22000, status: 'pending', date: '2081-03-18', email: 'bikash@email.com', notes: 'China Student Visa documentation assistance.' },
];

const initDB = (key, defaultData) => {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(defaultData));
  }
};

export const dbInit = () => {
  initDB('cvs-users', DEFAULT_USERS);
  initDB('cvs-invoices', DEFAULT_INVOICES);
  initDB('cvs-appointments', []);
};

export const dbGetUsers = async () => {
  dbInit();
  return JSON.parse(localStorage.getItem('cvs-users'));
};

export const dbRegisterUser = async (newUser) => {
  dbInit();
  const users = JSON.parse(localStorage.getItem('cvs-users')) || DEFAULT_USERS;

  if (newUser.role === 'admin' && newUser.adminCode !== ADMIN_REGISTRATION_CODE) {
    return { success: false, message: 'Invalid administrator registration code.' };
  }

  if (newUser.role === 'employee' && newUser.employeeCode !== EMPLOYEE_REGISTRATION_CODE) {
    return { success: false, message: 'Invalid employee registration code.' };
  }

  if (users.find((u) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
    return { success: false, message: 'Email already registered.' };
  }
  const user = {
    ...newUser,
    employeeCode: undefined,
    adminCode: undefined,
    status: newUser.role === 'customer' ? 'active' : 'pending',
  };
  users.push(user);
  localStorage.setItem('cvs-users', JSON.stringify(users));
  return { success: true, user };
};

export const dbLoginUser = async (email, password, role) => {
  const users = await dbGetUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role);
  if (!user) {
    return { success: false, message: 'Invalid credentials or role.' };
  }
  if (user.status === 'pending') {
    return { success: false, message: 'Your account is pending administrator approval.' };
  }
  return { success: true, user };
};

export const dbUpdateUserStatus = async (email, status) => {
  const users = await dbGetUsers();
  const updated = users.map((u) => u.email.toLowerCase() === email.toLowerCase() ? { ...u, status } : u);
  localStorage.setItem('cvs-users', JSON.stringify(updated));
  return { success: true };
};

export const dbUpdateUserPassword = async (email, password) => {
  const users = await dbGetUsers();
  const updated = users.map((u) => (
    u.email.toLowerCase() === email.toLowerCase() ? { ...u, password } : u
  ));
  localStorage.setItem('cvs-users', JSON.stringify(updated));
  return { success: true };
};

export const dbRequestAdminPasswordReset = async (email, phone) => {
  const users = await dbGetUsers();
  const adminUser = users.find((u) => u.role === 'admin' && u.email.toLowerCase() === email.toLowerCase());

  if (!adminUser) {
    return { success: false, message: 'Administrator account not found for this email.' };
  }

  const normalizedStoredPhone = (adminUser.phone || '').replace(/[^0-9]/g, '');
  const normalizedInputPhone = (phone || '').replace(/[^0-9]/g, '');

  if (!normalizedStoredPhone || normalizedStoredPhone !== normalizedInputPhone) {
    return { success: false, message: 'Phone number verification failed for this administrator account.' };
  }

  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const resetStore = JSON.parse(localStorage.getItem(ADMIN_RESET_STORE_KEY) || '{}');
  resetStore[email.toLowerCase()] = {
    code: verificationCode,
    createdAt: Date.now(),
  };
  localStorage.setItem(ADMIN_RESET_STORE_KEY, JSON.stringify(resetStore));

  return {
    success: true,
    maskedPhone: adminUser.phone,
    demoCode: verificationCode,
    message: 'Verification code generated successfully.',
  };
};

export const dbConfirmAdminPasswordReset = async (email, code, newPassword) => {
  const resetStore = JSON.parse(localStorage.getItem(ADMIN_RESET_STORE_KEY) || '{}');
  const record = resetStore[email.toLowerCase()];

  if (!record) {
    return { success: false, message: 'No verification request found. Please request a new code.' };
  }

  const isExpired = Date.now() - record.createdAt > 10 * 60 * 1000;
  if (isExpired) {
    delete resetStore[email.toLowerCase()];
    localStorage.setItem(ADMIN_RESET_STORE_KEY, JSON.stringify(resetStore));
    return { success: false, message: 'Verification code expired. Please request a new one.' };
  }

  if (record.code !== String(code).trim()) {
    return { success: false, message: 'Invalid verification code.' };
  }

  await dbUpdateUserPassword(email, newPassword);
  delete resetStore[email.toLowerCase()];
  localStorage.setItem(ADMIN_RESET_STORE_KEY, JSON.stringify(resetStore));
  return { success: true };
};

export const dbGetInvoices = async () => {
  dbInit();
  return JSON.parse(localStorage.getItem('cvs-invoices')).map(normalizeInvoice);
};

export const dbAddInvoice = async (invoice) => {
  const invoices = await dbGetInvoices();
  const newInvoice = normalizeInvoice({
    ...invoice,
    id: `INV-2081-${String(invoices.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
  });
  invoices.unshift(newInvoice);
  localStorage.setItem('cvs-invoices', JSON.stringify(invoices));
  return newInvoice;
};

export const dbUpdateInvoiceStatus = async (id, status) => {
  const invoices = await dbGetInvoices();
  const updated = invoices.map((inv) => inv.id === id ? { ...inv, status } : inv);
  localStorage.setItem('cvs-invoices', JSON.stringify(updated));
  return { success: true };
};

export const dbGetAppointments = async () => {
  dbInit();
  return JSON.parse(localStorage.getItem('cvs-appointments'));
};

export const dbAddAppointment = async (appt) => {
  const appts = await dbGetAppointments();
  const newAppt = {
    id: `APT-${String(appts.length + 1).padStart(4, '0')}`,
    ...appt,
    status: 'scheduled',
    createdDate: new Date().toISOString().split('T')[0],
  };
  appts.unshift(newAppt);
  localStorage.setItem('cvs-appointments', JSON.stringify(appts));
  return newAppt;
};

export const dbUpdateAppointmentStatus = async (id, status) => {
  const appts = await dbGetAppointments();
  const updated = appts.map((appt) => appt.id === id ? { ...appt, status } : appt);
  localStorage.setItem('cvs-appointments', JSON.stringify(updated));
  return { success: true };
};
