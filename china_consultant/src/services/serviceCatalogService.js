import { requireSupabase } from '../lib/supabase';
import { buildLikeQuery, handleSupabaseResult } from './_helpers';

const TABLE = 'service_catalog';

function dedupeServices(rows = []) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = String(row.title || '')
      .trim()
      .toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export const serviceCatalogService = {
  async create(payload) {
    const supabase = requireSupabase();
    const result = await supabase
      .from(TABLE)
      .insert({
        title: payload.title,
        description: payload.description,
        icon: payload.icon || null,
        sort_order: payload.sortOrder || 0,
        active: payload.active ?? true,
      })
      .select('*')
      .single();

    return handleSupabaseResult(result, 'Failed to create service.');
  },
  async getAll(filters = {}) {
    const supabase = requireSupabase();
    let query = supabase.from(TABLE).select('*').order('sort_order', { ascending: true });
    if (filters.active !== undefined) query = query.eq('active', filters.active);
    if (filters.search) {
      const term = buildLikeQuery(filters.search);
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }
    const rows = handleSupabaseResult(await query, 'Failed to fetch services.');
    return dedupeServices(rows);
  },
  async getById(id) {
    const supabase = requireSupabase();
    return handleSupabaseResult(await supabase.from(TABLE).select('*').eq('id', id).single(), 'Failed to fetch service.');
  },
  async update(id, payload) {
    const supabase = requireSupabase();
    const clean = Object.fromEntries(Object.entries({
      title: payload.title,
      description: payload.description,
      icon: payload.icon,
      sort_order: payload.sortOrder,
      active: payload.active,
    }).filter(([, value]) => value !== undefined));
    return handleSupabaseResult(await supabase.from(TABLE).update(clean).eq('id', id).select('*').single(), 'Failed to update service.');
  },
  async delete(id) {
    const supabase = requireSupabase();
    return handleSupabaseResult(await supabase.from(TABLE).delete().eq('id', id).select('*').single(), 'Failed to delete service.');
  },
};
