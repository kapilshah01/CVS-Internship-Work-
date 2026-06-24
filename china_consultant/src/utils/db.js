import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabase';
import { appointmentService } from '../services/appointmentService';
import { clientService } from '../services/clientService';
import { inquiryService } from '../services/inquiryService';
import { invoiceService } from '../services/invoiceService';
import { normalizeInvoice } from './invoice';

const EMPLOYEE_REGISTRATION_CODE = '16923';
const ADMIN_REGISTRATION_CODE = '27034';

const normalizeProfile = (row) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  phone: row.phone || '',
  role: row.role,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeClient = (row) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  phone: row.phone || '',
  country: row.country || '',
  source: row.source || '',
  status: row.status || 'new',
  notes: row.notes || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeAppointment = (row) => ({
  id: row.id,
  clientName: row.client_name,
  email: row.email,
  phone: row.phone || '',
  country: row.country,
  visaType: row.visa_type || '',
  purpose: row.purpose || row.visa_type || '',
  date: row.date,
  time: row.time,
  status: row.status,
  notes: row.notes || '',
  createdDate: row.created_date,
  customerId: row.customer_id || null,
  createdBy: row.created_by || null,
});

const normalizeInquiry = (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone || '',
  country: row.country || '',
  subject: row.subject,
  message: row.message,
  status: row.status,
  source: row.source,
  clientId: row.client_id || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeInvoiceRow = (row) =>
  normalizeInvoice({
    id: row.id,
    client: row.client,
    passport: row.passport,
    passportList: row.passport_list || [],
    travelerCount: row.traveler_count || 1,
    invoiceMode: row.invoice_mode || 'personal',
    country: row.country,
    visaType: row.visa_type,
    amount: Number(row.amount || 0),
    subtotal: Number(row.subtotal || 0),
    taxRate: Number(row.tax_rate || 0),
    taxAmount: Number(row.tax_amount || 0),
    total: Number(row.total || 0),
    status: row.status,
    date: row.date,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    email: row.email || '',
    notes: row.notes || '',
    paymentTerms: row.payment_terms || '',
    paymentMethod: row.payment_method || '',
    currency: row.currency || 'NPR',
    serviceItems: row.service_items || [],
    customerId: row.customer_id || null,
    createdBy: row.created_by || null,
  });

const createRecordId = (prefix) => {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
};

async function getCurrentProfile() {
  const client = requireSupabase();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.user) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) throw new Error(error.message);
  const profile = data;
  return normalizeProfile(profile);
}

async function getProfileById(id, retries = 5) {
  if (!id) return null;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const client = requireSupabase();
      const { data, error } = await client.from('profiles').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      const profile = data;
      if (profile) {
        return normalizeProfile(profile);
      }
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, 300));
  }

  return null;
}

export { isSupabaseConfigured };

export async function dbInit() {
  requireSupabase();
}

export async function dbGetCurrentUser() {
  return getCurrentProfile();
}

export function dbOnAuthStateChange(callback) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe() {} } } };
  }

  return supabase.auth.onAuthStateChange(async () => {
    try {
      callback(await getCurrentProfile());
    } catch {
      callback(null);
    }
  });
}

export async function dbLogoutUser() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function dbRegisterUser(newUser) {
  const role = newUser.role || 'employee';

  if (!['admin', 'employee'].includes(role)) {
    return { success: false, message: 'Public customer registration is disabled. Please use the website inquiry or appointment forms instead.' };
  }

  const client = requireSupabase();
  const email = newUser.email.trim();
  const redirectPath = role === 'admin' ? '/admin/login' : '/employee/login';

  if (role === 'admin' && newUser.adminCode !== ADMIN_REGISTRATION_CODE) {
    return { success: false, message: 'Invalid administrator registration code.' };
  }

  if (role === 'employee' && newUser.employeeCode !== EMPLOYEE_REGISTRATION_CODE) {
    return { success: false, message: 'Invalid employee registration code.' };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password: newUser.password,
    options: {
      emailRedirectTo: `${window.location.origin}${redirectPath}`,
      data: {
        name: newUser.name.trim(),
        phone: newUser.phone?.trim() || '',
        role,
        status: role === 'admin' ? 'pending' : 'active',
      },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  const userId = data.user?.id || null;
  const hasSession = Boolean(data.session);
  const profile = userId ? await getProfileById(userId).catch(() => null) : null;

  if (data.session) {
    await client.auth.signOut();
  }

  return {
    success: true,
    user: profile,
    requiresEmailConfirmation: !hasSession,
    message: !hasSession
      ? `Registration successful. A verification email has been sent to ${email}. Please verify your email before signing in.`
      : role === 'admin'
        ? 'Administrator account created. An existing admin must activate it before you can sign in.'
        : 'Employee account created successfully. You can sign in now.',
  };
}

export async function dbLoginUser(email, password, role) {
  if (!['admin', 'employee'].includes(role)) {
    return { success: false, message: 'Only admin and employee login is available.' };
  }

  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });

  if (error) {
    if (/email.*confirm|email.*verified|not confirmed/i.test(error.message)) {
      return { success: false, message: 'Your email is not verified yet. Please open the verification link from your inbox first.' };
    }
    return { success: false, message: error.message };
  }

  const profile = await getCurrentProfile() || await getProfileById(data.user?.id).catch(() => null);
  if (!profile) {
    await client.auth.signOut();
    return { success: false, message: 'Profile not ready yet for this account. Please try again in a moment.' };
  }

  if (profile.role !== role) {
    await client.auth.signOut();
    return { success: false, message: 'This account is registered under a different role.' };
  }

  if (profile.status === 'pending') {
    await client.auth.signOut();
    return {
      success: false,
      message: profile.role === 'admin'
        ? 'Your admin account is waiting for approval from an active administrator.'
        : 'Your account is pending approval.',
    };
  }

  if (profile.status !== 'active') {
    await client.auth.signOut();
    return { success: false, message: 'This account is not active. Please contact the administrator.' };
  }

  return { success: true, user: profile };
}

export async function dbRequestAdminPasswordReset(email) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/admin/login`,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Password reset email sent. Please check your inbox.' };
}

export async function dbResendVerificationEmail(email) {
  const client = requireSupabase();
  const cleanEmail = email.trim();
  const redirectTo = `${window.location.origin}/employee/login`;
  const { error } = await client.auth.resend({
    type: 'signup',
    email: cleanEmail,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: `Verification email sent to ${cleanEmail}. Please check your inbox and spam folder.`,
  };
}

export async function dbGetUsers(filters = {}) {
  const client = requireSupabase();
  let query = client.from('profiles').select('*').order('created_at', { ascending: false });
  if (filters.role) query = query.eq('role', filters.role);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(normalizeProfile);
}

export async function dbUpdateUserStatus(email, status) {
  const users = await dbGetUsers({ search: email });
  const target = users.find((row) => row.email.toLowerCase() === email.trim().toLowerCase());
  if (!target) throw new Error('User not found.');
  const client = requireSupabase();
  const { error } = await client.from('profiles').update({ status }).eq('id', target.id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function dbDeleteUserProfile(id) {
  const client = requireSupabase();
  const { error } = await client.from('profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function dbGetClients(filters = {}) {
  const data = await clientService.getAll(filters);
  return data.map(normalizeClient);
}

export async function dbAddClient(payload) {
  const created = await clientService.create(payload);
  return normalizeClient(created);
}

export async function dbUpdateClient(id, payload) {
  const updated = await clientService.update(id, payload);
  return normalizeClient(updated);
}

export async function dbDeleteClient(id) {
  await clientService.delete(id);
  return { success: true };
}

async function ensureClientRecord({ name, email, phone = '', country = '', source = 'website', notes = '' }) {
  if (!email?.trim()) return null;

  const existing = await clientService.getAll({ search: email.trim() });
  const found = existing.find((item) => item.email?.toLowerCase() === email.trim().toLowerCase());

  if (found) {
    return normalizeClient(await clientService.update(found.id, {
      name: name || found.name,
      phone: phone || found.phone,
      country: country || found.country,
      source: source || found.source,
      notes: notes || found.notes,
      status: found.status || 'new',
    }));
  }

  return dbAddClient({ name, email, phone, country, source, notes, status: 'new' });
}

async function ensureClientRecordSafe(payload) {
  try {
    return await ensureClientRecord(payload);
  } catch {
    return null;
  }
}

export async function dbGetInvoices(filters = {}) {
  const data = await invoiceService.getAll(filters);
  return data.map(normalizeInvoiceRow);
}

export async function dbAddInvoice(invoice) {
  let user = null;
  try {
    user = await getCurrentProfile();
  } catch (error) {
    console.warn('Unable to load current profile for invoice creation:', error);
  }
  const record = normalizeInvoice({
    ...invoice,
    id: createRecordId('INV'),
    date: invoice.date || new Date().toISOString().split('T')[0],
  });

  const created = await invoiceService.create({
    ...record,
    createdBy: user?.id || null,
  });

  return normalizeInvoiceRow(created);
}

export async function dbUpdateInvoiceStatus(id, status) {
  await invoiceService.update(id, { status });
  return { success: true };
}

export async function dbDeleteInvoice(id) {
  await invoiceService.delete(id);
  return { success: true };
}

export async function dbGetAppointments(filters = {}) {
  const data = await appointmentService.getAll(filters);
  return data.map(normalizeAppointment);
}

export async function dbAddAppointment(appt) {
  const user = await getCurrentProfile();
  const clientRecord = await ensureClientRecordSafe({
    name: appt.clientName,
    email: appt.email,
    phone: appt.phone || '',
    country: appt.country || '',
    source: 'appointment',
    notes: appt.notes || '',
  });
  const created = await appointmentService.create({
    ...appt,
    id: appt.id || createRecordId('APT'),
    createdDate: appt.createdDate || new Date().toISOString().split('T')[0],
    customerId: appt.customerId || clientRecord?.id || null,
    createdBy: appt.createdBy || user?.id || null,
  });
  return normalizeAppointment(created);
}

export async function dbUpdateAppointmentStatus(id, status) {
  await appointmentService.update(id, { status });
  return { success: true };
}

export async function dbDeleteAppointment(id) {
  await appointmentService.delete(id);
  return { success: true };
}

export async function dbGetInquiries(filters = {}) {
  const data = await inquiryService.getAll(filters);
  return data.map(normalizeInquiry);
}

export async function dbAddInquiry(inquiry) {
  const user = await getCurrentProfile();
  const clientRecord = await ensureClientRecordSafe({
    name: inquiry.fullName,
    email: inquiry.email,
    phone: inquiry.phone || '',
    country: inquiry.country || '',
    source: inquiry.source || 'website',
    notes: inquiry.message || '',
  });
  const created = await inquiryService.create({
    ...inquiry,
    clientId: inquiry.clientId || clientRecord?.id || user?.id || null,
  });
  return normalizeInquiry(created);
}

export async function dbUpdateInquiry(id, payload) {
  const updated = await inquiryService.update(id, payload);
  return normalizeInquiry(updated);
}

export async function dbDeleteInquiry(id) {
  await inquiryService.delete(id);
  return { success: true };
}
