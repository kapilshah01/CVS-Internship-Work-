import { requireSupabase } from '../lib/supabase';
import { buildLikeQuery, handleSupabaseResult } from './_helpers';

const TABLE = 'invoices';

export const invoiceService = {
  async create(payload) {
    const supabase = requireSupabase();
    const result = await supabase
      .from(TABLE)
      .insert({
        id: payload.id,
        client: payload.client,
        passport: payload.passport,
        passport_list: payload.passportList || [],
        traveler_count: payload.travelerCount || 1,
        invoice_mode: payload.invoiceMode || 'personal',
        country: payload.country,
        visa_type: payload.visaType,
        amount: payload.amount || 0,
        subtotal: payload.subtotal || 0,
        tax_rate: payload.taxRate || 0,
        tax_amount: payload.taxAmount || 0,
        total: payload.total || 0,
        status: payload.status || 'draft',
        date: payload.date,
        issue_date: payload.issueDate,
        due_date: payload.dueDate,
        email: payload.email || null,
        notes: payload.notes || null,
        payment_terms: payload.paymentTerms || null,
        payment_method: payload.paymentMethod || null,
        currency: payload.currency || 'NPR',
        service_items: payload.serviceItems || [],
        customer_id: payload.customerId || null,
        created_by: payload.createdBy || null,
      })
      .select('*')
      .single();

    return handleSupabaseResult(result, 'Failed to create invoice.');
  },

  async getAll(filters = {}) {
    const supabase = requireSupabase();
    let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters.country) query = query.eq('country', filters.country);
    if (filters.search) {
      const term = buildLikeQuery(filters.search);
      query = query.or(`client.ilike.${term},id.ilike.${term},passport.ilike.${term},email.ilike.${term}`);
    }

    return handleSupabaseResult(await query, 'Failed to fetch invoices.');
  },

  async getById(id) {
    const supabase = requireSupabase();
    const result = await supabase.from(TABLE).select('*').eq('id', id).single();
    return handleSupabaseResult(result, 'Failed to fetch invoice.');
  },

  async update(id, payload) {
    const supabase = requireSupabase();
    const mapped = {
      client: payload.client,
      passport: payload.passport,
      passport_list: payload.passportList,
      traveler_count: payload.travelerCount,
      invoice_mode: payload.invoiceMode,
      country: payload.country,
      visa_type: payload.visaType,
      amount: payload.amount,
      subtotal: payload.subtotal,
      tax_rate: payload.taxRate,
      tax_amount: payload.taxAmount,
      total: payload.total,
      status: payload.status,
      date: payload.date,
      issue_date: payload.issueDate,
      due_date: payload.dueDate,
      email: payload.email,
      notes: payload.notes,
      payment_terms: payload.paymentTerms,
      payment_method: payload.paymentMethod,
      currency: payload.currency,
      service_items: payload.serviceItems,
      customer_id: payload.customerId,
      created_by: payload.createdBy,
    };
    const clean = Object.fromEntries(Object.entries(mapped).filter(([, value]) => value !== undefined));
    const result = await supabase.from(TABLE).update(clean).eq('id', id).select('*').single();
    return handleSupabaseResult(result, 'Failed to update invoice.');
  },

  async delete(id) {
    const supabase = requireSupabase();
    const result = await supabase.from(TABLE).delete().eq('id', id).select('*').single();
    return handleSupabaseResult(result, 'Failed to delete invoice.');
  },
};
