import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

const LIST_COLUMNS = 'id, lot_number, lot_title, inquirer_name, email, phone, inquiry_type, message, status, created_at';

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
        (i.lot_number && i.lot_number.includes(q)) ||
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
    if (isSupabaseConfigured()) {
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('inquiries')
          .select(LIST_COLUMNS, { count: 'exact' });

        if (status && status !== 'All') {
          query = query.eq('status', status);
        }
        if (search && search.trim() !== '') {
          const s = search.trim();
          query = query.or(`inquirer_name.ilike.%${s}%,email.ilike.%${s}%,lot_title.ilike.%${s}%`);
        }

        query = query.order(sortBy, { ascending: sortAsc }).range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          return {
            data: data,
            total: count || data.length,
            page,
            pageSize,
            totalPages: Math.ceil((count || data.length) / pageSize),
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
        (i.lot_number && i.lot_number.includes(q)) ||
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
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('inquiries').select('id, status');
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
      repliedCount: inqs.filter(i => i.status === 'Replied' || i.status === 'Closed').length
    };
  },

  async updateInquiryStatus(id, newStatus) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('inquiries')
          .update({ status: newStatus })
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
    inqs[index] = { ...inqs[index], status: newStatus };
    localDB.setInquiries([...inqs]);
    return inqs[index];
  },

  async deleteInquiry(id) {
    if (isSupabaseConfigured()) {
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

