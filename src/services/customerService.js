import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

const LIST_COLUMNS = 'id, customer_id, auth_user_id, full_name, email, phone, city, state, interest, total_spent, orders_count, account_status, notes, created_at, updated_at';

export const customerService = {
  // In-memory instant synchronous retrieval for 0ms page transitions
  getCustomersSync({
    page = 1,
    pageSize = 10,
    search = '',
    tier = '',
    sortBy = 'created_at',
    sortAsc = false
  } = {}) {
    let custs = localDB.getCustomers();

    if (tier && tier !== 'All') {
      custs = custs.filter(c => c.tier === tier);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      custs = custs.filter(c => 
        (c.full_name && c.full_name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }

    custs.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'created_at') {
        return sortAsc ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
      }
      if (typeof valA === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    const total = custs.length;
    const from = (page - 1) * pageSize;
    const paginated = custs.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },
  async getCustomers({
    page = 1,
    pageSize = 10,
    search = '',
    tier = '',
    sortBy = 'created_at',
    sortAsc = false
  } = {}) {
    if (isSupabaseConfigured()) {
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('customers')
          .select(LIST_COLUMNS, { count: 'exact' });

        if (tier && tier !== 'All') {
          query = query.eq('tier', tier);
        }
        if (search && search.trim() !== '') {
          const s = search.trim();
          query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,city.ilike.%${s}%`);
        }

        query = query.order(sortBy, { ascending: sortAsc }).range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
          data: data || [],
          total: count !== null && count !== undefined ? count : (data?.length || 0),
          page,
          pageSize,
          totalPages: Math.ceil((count !== null && count !== undefined ? count : (data?.length || 0)) / pageSize) || 1,
        };
      } catch (err) {
        console.error('Supabase getCustomers error:', err);
        return { data: [], total: 0, page, pageSize, totalPages: 1 };
      }
    }

    return { data: [], total: 0, page, pageSize, totalPages: 1 };

    if (tier && tier !== 'All') {
      custs = custs.filter(c => c.tier === tier);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      custs = custs.filter(c => 
        (c.full_name && c.full_name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }

    custs.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'created_at') {
        return sortAsc ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
      }
      if (typeof valA === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    const total = custs.length;
    const from = (page - 1) * pageSize;
    const paginated = custs.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async getCustomerById(id) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase getCustomerById error:', err);
      }
    }

    const custs = localDB.getCustomers();
    return custs.find(c => c.id === id) || null;
  },

  async createCustomer(custData) {
    const generatedCustId = custData.customer_id || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCust = {
      ...custData,
      id: custData.id || `cust-${Date.now().toString().slice(-6)}`,
      customer_id: generatedCustId,
      auth_user_id: custData.auth_user_id || null,
      full_name: custData.full_name || custData.name || 'Collector',
      email: custData.email,
      phone: custData.phone || '',
      city: custData.city ? custData.city.trim() : null,
      state: custData.state ? custData.state.trim() : null,
      interest: custData.interest || 'Precious Metals & Rare Coins',
      total_spent: Number(custData.total_spent) || 0,
      orders_count: Number(custData.orders_count) || 0,
      account_status: custData.account_status || 'Active',
      notes: custData.notes || 'Registered via Highlander online portal.',
      created_at: custData.created_at || new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .upsert([newCust], { onConflict: 'email' })
          .select()
          .single();
        if (error) {
          console.warn('Supabase createCustomer warning, saving to localDB:', error);
        } else if (data) {
          const custs = localDB.getCustomers();
          localDB.setCustomers([data, ...custs]);
          return data;
        }
      } catch (err) {
        console.warn('Supabase createCustomer error, saving to localDB:', err);
      }
    }

    const custs = localDB.getCustomers();
    const updated = [newCust, ...custs];
    localDB.setCustomers(updated);
    return newCust;
  },

  async updateCustomer(id, custData) {
    // Whitelist only valid columns of public.customers to avoid 400 errors (e.g. unknown column "role")
    const validFields = [
      'customer_id',
      'auth_user_id',
      'full_name',
      'email',
      'phone',
      'city',
      'state',
      'interest',
      'total_spent',
      'orders_count',
      'account_status',
      'notes'
    ];

    const cleanPayload = {};
    for (const key of Object.keys(custData)) {
      if (validFields.includes(key) && custData[key] !== undefined) {
        cleanPayload[key] = custData[key];
      }
    }
    if (custData.name && !cleanPayload.full_name) {
      cleanPayload.full_name = custData.name;
    }
    if (cleanPayload.total_spent !== undefined) {
      cleanPayload.total_spent = Number(cleanPayload.total_spent) || 0;
    }
    if (cleanPayload.orders_count !== undefined) {
      cleanPayload.orders_count = Number(cleanPayload.orders_count) || 0;
    }
    cleanPayload.updated_at = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        // Attempt update by primary key id first
        let { data, error } = await supabase
          .from('customers')
          .update(cleanPayload)
          .eq('id', id)
          .select();

        // If no rows matched by id, try matching by customer_id or email
        if (!error && (!data || data.length === 0)) {
          const fallbackId = cleanPayload.customer_id || id;
          const retryRes = await supabase
            .from('customers')
            .update(cleanPayload)
            .or(`customer_id.eq.${fallbackId},email.eq.${cleanPayload.email || ''}`)
            .select();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error) {
          console.warn('Supabase updateCustomer warning, falling back to local update:', error);
        } else if (data?.[0]) {
          const custs = localDB.getCustomers();
          const idx = custs.findIndex(c => c.id === id || c.customer_id === id || c.email === cleanPayload.email);
          if (idx !== -1) {
            custs[idx] = { ...custs[idx], ...data[0] };
            localDB.setCustomers([...custs]);
          }
          return data[0];
        }
      } catch (err) {
        console.warn('Supabase updateCustomer error, saving to localDB:', err);
      }
    }

    const custs = localDB.getCustomers();
    const index = custs.findIndex(c => c.id === id || c.customer_id === id || c.email === custData.email);
    if (index === -1) {
      const fallbackCust = { id, ...cleanPayload };
      localDB.setCustomers([fallbackCust, ...custs]);
      return fallbackCust;
    }
    custs[index] = { ...custs[index], ...cleanPayload };
    localDB.setCustomers([...custs]);
    return custs[index];
  },

  async deleteCustomer(id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Supabase deleteCustomer error:', err);
        throw err;
      }
    }

    const custs = localDB.getCustomers();
    const filtered = custs.filter(c => c.id !== id);
    localDB.setCustomers(filtered);
    return true;
  }
};

