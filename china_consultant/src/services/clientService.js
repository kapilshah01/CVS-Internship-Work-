import { requireSupabase } from '../lib/supabase';
import { buildLikeQuery, handleSupabaseResult } from './_helpers';

const TABLE = 'clients';

export const clientService = {
  async create(payload) {
    const supabase = requireSupabase();
    const result = await supabase
      .from(TABLE)
      .insert({
        email: payload.email,
        name: payload.name,
        phone: payload.phone || null,
        country: payload.country || null,
        source: payload.source || 'website',
        status: payload.status || 'new',
        notes: payload.notes || null,
      })
      .select('*')
      .single();

    return handleSupabaseResult(result, 'Failed to create client.');
  },

  async getAll(filters = {}) {
    const supabase = requireSupabase();
    let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) {
      const term = buildLikeQuery(filters.search);
      query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }

    return handleSupabaseResult(await query, 'Failed to fetch clients.');
  },

  async getById(id) {
    const supabase = requireSupabase();
    const result = await supabase.from(TABLE).select('*').eq('id', id).single();
    return handleSupabaseResult(result, 'Failed to fetch client.');
  },

  async update(id, payload) {
    const supabase = requireSupabase();
    const mapped = {
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      country: payload.country,
      source: payload.source,
      status: payload.status,
      notes: payload.notes,
    };
    const clean = Object.fromEntries(Object.entries(mapped).filter(([, value]) => value !== undefined));
    const result = await supabase.from(TABLE).update(clean).eq('id', id).select('*').single();
    return handleSupabaseResult(result, 'Failed to update client.');
  },

  async delete(id) {
    const supabase = requireSupabase();
    const result = await supabase.from(TABLE).delete().eq('id', id).select('*').single();
    return handleSupabaseResult(result, 'Failed to delete client.');
  },
};
