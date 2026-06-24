import { requireSupabase } from '../lib/supabase';
import { buildLikeQuery, handleSupabaseResult } from './_helpers';

const TABLE = 'inquiries';

export const inquiryService = {
  async create(payload) {
    const supabase = requireSupabase();
    const result = await supabase
      .from(TABLE)
      .insert({
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone || null,
        country: payload.country || null,
        subject: payload.subject || 'Visa Inquiry',
        message: payload.message,
        status: payload.status || 'new',
        source: payload.source || 'website',
        client_id: payload.clientId || null,
      })
      .select('*')
      .single();

    return handleSupabaseResult(result, 'Failed to create inquiry.');
  },

  async getAll(filters = {}) {
    const supabase = requireSupabase();
    let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.clientId) query = query.eq('client_id', filters.clientId);
    if (filters.search) {
      const term = buildLikeQuery(filters.search);
      query = query.or(`full_name.ilike.${term},email.ilike.${term},subject.ilike.${term},message.ilike.${term}`);
    }

    return handleSupabaseResult(await query, 'Failed to fetch inquiries.');
  },

  async getById(id) {
    const supabase = requireSupabase();
    const result = await supabase.from(TABLE).select('*').eq('id', id).single();
    return handleSupabaseResult(result, 'Failed to fetch inquiry.');
  },

  async update(id, payload) {
    const supabase = requireSupabase();
    const mapped = {
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      country: payload.country,
      subject: payload.subject,
      message: payload.message,
      status: payload.status,
      source: payload.source,
      client_id: payload.clientId,
    };
    const clean = Object.fromEntries(Object.entries(mapped).filter(([, value]) => value !== undefined));
    const result = await supabase.from(TABLE).update(clean).eq('id', id).select('*').single();
    return handleSupabaseResult(result, 'Failed to update inquiry.');
  },

  async delete(id) {
    const supabase = requireSupabase();
    const result = await supabase.from(TABLE).delete().eq('id', id).select('*').single();
    return handleSupabaseResult(result, 'Failed to delete inquiry.');
  },
};
