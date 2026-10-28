import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

const LIST_COLUMNS = 'id, transaction_id, order_id, customer_name, customer_email, amount, payment_method, payment_status, gateway_reference, created_at';

export const paymentService = {
  async getPayments({
    page = 1,
    pageSize = 10,
    search = '',
    paymentStatus = '',
    paymentMethod = '',
    sortBy = 'created_at',
    sortAsc = false
  } = {}) {
    if (isSupabaseConfigured()) {
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('payments')
          .select(LIST_COLUMNS, { count: 'exact' });

        if (paymentStatus && paymentStatus !== 'All') {
          query = query.eq('payment_status', paymentStatus);
        }
        if (paymentMethod && paymentMethod !== 'All') {
          query = query.eq('payment_method', paymentMethod);
        }
        if (search && search.trim() !== '') {
          const s = search.trim();
          query = query.or(`transaction_id.ilike.%${s}%,order_id.ilike.%${s}%,customer_name.ilike.%${s}%`);
        }

        query = query.order(sortBy, { ascending: sortAsc }).range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
          data: data || [],
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        };
      } catch (err) {
        console.error('Supabase getPayments error, using local fallback:', err);
      }
    }

    let txns = localDB.getPayments();

    if (paymentStatus && paymentStatus !== 'All') {
      txns = txns.filter(t => t.payment_status === paymentStatus);
    }
    if (paymentMethod && paymentMethod !== 'All') {
      txns = txns.filter(t => t.payment_method === paymentMethod);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      txns = txns.filter(t => 
        (t.transaction_id && t.transaction_id.toLowerCase().includes(q)) ||
        (t.order_id && t.order_id.toLowerCase().includes(q)) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
        (t.customer_email && t.customer_email.toLowerCase().includes(q))
      );
    }

    txns.sort((a, b) => {
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

    const total = txns.length;
    const from = (page - 1) * pageSize;
    const paginated = txns.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async getPaymentMetrics() {
    const txns = isSupabaseConfigured() ? [] : localDB.getPayments();
    const totalCollected = txns.filter(t => t.payment_status === 'Completed').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const successfulCount = txns.filter(t => t.payment_status === 'Completed').length;
    const pendingCount = txns.filter(t => t.payment_status === 'Pending').length;
    const refundedTotal = txns.filter(t => t.payment_status === 'Refunded').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      totalCollected,
      successfulCount,
      pendingCount,
      refundedTotal
    };
  },

  async createPayment(paymentData) {
    const newTxn = {
      ...paymentData,
      id: paymentData.id || `txn-${Date.now().toString().slice(-4)}`,
      transaction_id: paymentData.transaction_id || `TXN-2026-${Math.floor(100 + Math.random() * 900)}`,
      amount: Number(paymentData.amount) || 0,
      payment_status: paymentData.payment_status || 'Completed',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .insert([newTxn])
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase createPayment error:', err);
        throw err;
      }
    }

    const txns = localDB.getPayments();
    const updated = [newTxn, ...txns];
    localDB.setPayments(updated);
    return newTxn;
  }
};

