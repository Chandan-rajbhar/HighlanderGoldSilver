import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

export const inquiryService = {
  // In-memory instant synchronous retrieval for 0ms page transitions
  getInquiriesSync({
    page = 1,
    pageSize = 10,
    search = '',
    status = '',
    sortBy = 'created_at',
    sortAsc = false
  } = {}) {
    let inqs = localDB.getInquiries();

    if (status && status !== 'All') {
      inqs = inqs.filter(i => i.status === status);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      inqs = inqs.filter(i => 
        (i.inquirer_name && i.inquirer_name.toLowerCase().includes(q)) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.lot_title && i.lot_title.toLowerCase().includes(q)) ||
        (i.lot_number && String(i.lot_number).includes(q)) ||
        (i.inquiry_type && i.inquiry_type.toLowerCase().includes(q)) ||
        (i.message && i.message.toLowerCase().includes(q))
      );
    }

    inqs.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'created_at') {
        return sortAsc ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    const total = inqs.length;
    const from = (page - 1) * pageSize;
    const paginated = inqs.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async getInquiries({
    page = 1,
    pageSize = 10,
    search = '',
    status = '',
    sortBy = 'created_at',
    sortAsc = false
  } = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('inquiries')
          .select('*', { count: 'exact' });

        if (status && status !== 'All') {
          query = query.eq('status', status);
        }
        if (search && search.trim() !== '') {
          const s = search.trim();
          query = query.or(`inquirer_name.ilike.%${s}%,email.ilike.%${s}%,lot_title.ilike.%${s}%,inquiry_type.ilike.%${s}%,message.ilike.%${s}%`);
        }

        query = query.order(sortBy, { ascending: sortAsc }).range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        if (data !== null && data !== undefined) {
          const totalCount = count !== null && count !== undefined ? count : data.length;
          return {
            data: data,
            total: totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize) || 1,
          };
        }
      } catch (err) {
        console.error('Supabase getInquiries error, using local fallback:', err);
      }
    }

    let inqs = localDB.getInquiries();

    if (status && status !== 'All') {
      inqs = inqs.filter(i => i.status === status);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      inqs = inqs.filter(i => 
        (i.inquirer_name && i.inquirer_name.toLowerCase().includes(q)) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.lot_title && i.lot_title.toLowerCase().includes(q)) ||
        (i.lot_number && String(i.lot_number).includes(q)) ||
        (i.inquiry_type && i.inquiry_type.toLowerCase().includes(q)) ||
        (i.message && i.message.toLowerCase().includes(q))
      );
    }

    inqs.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'created_at') {
        return sortAsc ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    const total = inqs.length;
    const from = (page - 1) * pageSize;
    const paginated = inqs.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async getInquiryStats() {
    let inqs = [];
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('inquiries').select('id, status');
        if (error) throw error;
        inqs = data || [];
      } catch (err) {
        console.error('Supabase getInquiryStats error, using localDB fallback:', err);
        inqs = localDB.getInquiries();
      }
    } else {
      inqs = localDB.getInquiries();
    }

    return {
      total: inqs.length,
      newCount: inqs.filter(i => i.status === 'New').length,
      inProgressCount: inqs.filter(i => i.status === 'In Progress').length,
      repliedCount: inqs.filter(i => i.status === 'Replied').length
    };
  },

  async createInquiry(payload) {
    const id = payload.id || `inq-${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date().toISOString();
    const newRecord = {
      id,
      lot_number: payload.lot_number || payload.lotNumber || null,
      lot_title: payload.lot_title || payload.lotTitle || payload.productRef || 'General Inquiry',
      inquirer_name: payload.inquirer_name || payload.fullName || 'Anonymous Collector',
      email: payload.email,
      phone: payload.phone || null,
      inquiry_type: payload.inquiry_type || payload.inquiryType || 'General',
      message: payload.message || '',
      status: payload.status || 'New',
      created_at: payload.created_at || now,
      updated_at: payload.updated_at || now
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('inquiries')
          .insert([newRecord])
          .select()
          .single();
        if (error) throw error;
        return data || newRecord;
      } catch (err) {
        console.error('Supabase createInquiry error:', err);
      }
    }

    const inqs = localDB.getInquiries();
    localDB.setInquiries([newRecord, ...inqs]);
    return newRecord;
  },

  async updateInquiryStatus(id, newStatus) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('inquiries')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase updateInquiryStatus error:', err);
        throw err;
      }
    }

    const inqs = localDB.getInquiries();
    const index = inqs.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Inquiry not found');
    inqs[index] = { ...inqs[index], status: newStatus, updated_at: new Date().toISOString() };
    localDB.setInquiries([...inqs]);
    return inqs[index];
  },

  async deleteInquiry(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from('inquiries')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Supabase deleteInquiry error:', err);
        throw err;
      }
    }

    const inqs = localDB.getInquiries();
    const filtered = inqs.filter(i => i.id !== id);
    localDB.setInquiries(filtered);
    return true;
  }
};
