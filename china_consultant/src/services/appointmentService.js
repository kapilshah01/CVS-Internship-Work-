import { requireSupabase } from '../lib/supabase';
import { buildLikeQuery, handleSupabaseResult } from './_helpers';

const TABLE = 'appointments';

export const appointmentService = {
  async create(payload) {
    const supabase = requireSupabase();
    const result = await supabase
      .from(TABLE)
      .insert({
        id: payload.id,
        client_name: payload.clientName,
        email: payload.email,
        phone: payload.phone || null,
        country: payload.country,
        visa_type: payload.visaType || null,
        purpose: payload.purpose || payload.visaType || null,
        date: payload.date,
        time: payload.time,
        status: payload.status || 'scheduled',
        notes: payload.notes || null,
        created_date: payload.createdDate,
        customer_id: payload.customerId || null,
        created_by: payload.createdBy || null,
      })
      .select('*')
      .single();

    return handleSupabaseResult(result, 'Failed to create appointment.');
  },

  async getAll(filters = {}) {
    const supabase = requireSupabase();
    let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.date) query = query.eq('date', filters.date);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters.search) {
      const term = buildLikeQuery(filters.search);
      query = query.or(`client_name.ilike.${term},email.ilike.${term},id.ilike.${term},purpose.ilike.${term}`);
    }

    return handleSupabaseResult(await query, 'Failed to fetch appointments.');
  },

  async getById(id) {
    const supabase = requireSupabase();
    const result = await supabase.from(TABLE).select('*').eq('id', id).single();
    return handleSupabaseResult(result, 'Failed to fetch appointment.');
  },

  async update(id, payload) {
    const supabase = requireSupabase();
    const mapped = {
      client_name: payload.clientName,
      email: payload.email,
      phone: payload.phone,
      country: payload.country,
      visa_type: payload.visaType,
      purpose: payload.purpose,
      date: payload.date,
      time: payload.time,
      status: payload.status,
      notes: payload.notes,
      customer_id: payload.customerId,
      created_by: payload.createdBy,
    };
    const clean = Object.fromEntries(Object.entries(mapped).filter(([, value]) => value !== undefined));
    const result = await supabase.from(TABLE).update(clean).eq('id', id).select('*').single();
    return handleSupabaseResult(result, 'Failed to update appointment.');
  },

  async delete(id) {
    const supabase = requireSupabase();
    const result = await supabase.from(TABLE).delete().eq('id', id);
    handleSupabaseResult(result, 'Failed to delete appointment.');
    return { success: true };
  },
};
