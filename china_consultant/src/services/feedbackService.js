import { requireSupabase } from '../lib/supabase';
import { buildLikeQuery, handleSupabaseResult } from './_helpers';

const TABLE = 'feedback';

export const feedbackService = {
  async create(payload) {
    const supabase = requireSupabase();
    const result = await supabase
      .from(TABLE)
      .insert({
        full_name: payload.fullName,
        email: payload.email,
        rating: payload.rating || 5,
        message: payload.message,
        source: payload.source || 'website',
        client_id: payload.clientId || null,
      })
      .select('*')
      .single();

    return handleSupabaseResult(result, 'Failed to submit feedback.');
  },

  async getAll(filters = {}) {
    const supabase = requireSupabase();
    let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });

    if (filters.search) {
      const term = buildLikeQuery(filters.search);
      query = query.or(`full_name.ilike.${term},email.ilike.${term},message.ilike.${term}`);
    }

    return handleSupabaseResult(await query, 'Failed to fetch feedback.');
  },

  async delete(id) {
    const supabase = requireSupabase();
    const result = await supabase.from(TABLE).delete().eq('id', id).select('*').single();
    return handleSupabaseResult(result, 'Failed to delete feedback.');
  },
};
