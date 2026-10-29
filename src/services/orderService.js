import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

const LIST_COLUMNS = 'id, order_number, customer_id, customer_name, customer_email, base_subtotal, buyers_premium_total, total_settlement, payment_method, payment_status, fulfillment_status, created_at';

export const orderService = {
  // In-memory instant synchronous retrieval for 0ms page transitions
  getOrdersSync({
    page = 1,
    pageSize = 10,
    search = '',
    paymentStatus = '',
    fulfillmentStatus = '',
    sortBy = 'created_at',
    sortAsc = false
  } = {}) {
    let orders = localDB.getOrders();

    if (paymentStatus && paymentStatus !== 'All') {
      orders = orders.filter(o => {
        if (paymentStatus === 'Pending') {
          return o.payment_status === 'Pending' || o.payment_status === 'Pending Wire';
        }
        return o.payment_status === paymentStatus;
      });
    }
    if (fulfillmentStatus && fulfillmentStatus !== 'All') {
      orders = orders.filter(o => o.fulfillment_status === fulfillmentStatus);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      orders = orders.filter(o => 
        (o.order_number && o.order_number.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(q))
      );
    }

    orders.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'created_at') {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return sortAsc ? dateA - dateB : dateB - dateA;
      }
      if (typeof valA === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    const total = orders.length;
    const from = (page - 1) * pageSize;
    const paginated = orders.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },
  async getOrders({
    page = 1,
    pageSize = 10,
    search = '',
    paymentStatus = '',
    fulfillmentStatus = '',
    sortBy = 'created_at',
    sortAsc = false
  } = {}) {
    if (isSupabaseConfigured()) {
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('orders')
          .select(LIST_COLUMNS, { count: 'exact' });

        if (paymentStatus && paymentStatus !== 'All') {
          query = query.eq('payment_status', paymentStatus);
        }
        if (fulfillmentStatus && fulfillmentStatus !== 'All') {
          query = query.eq('fulfillment_status', fulfillmentStatus);
        }
        if (search && search.trim() !== '') {
          const s = search.trim();
          query = query.or(`order_number.ilike.%${s}%,customer_name.ilike.%${s}%,customer_email.ilike.%${s}%`);
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
        console.error('Supabase getOrders error, using local fallback:', err);
      }
    }

    let orders = localDB.getOrders();

    if (paymentStatus && paymentStatus !== 'All') {
      orders = orders.filter(o => {
        if (paymentStatus === 'Pending') {
          return o.payment_status === 'Pending' || o.payment_status === 'Pending Wire';
        }
        return o.payment_status === paymentStatus;
      });
    }
    if (fulfillmentStatus && fulfillmentStatus !== 'All') {
      orders = orders.filter(o => o.fulfillment_status === fulfillmentStatus);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      orders = orders.filter(o => 
        (o.order_number && o.order_number.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(q))
      );
    }

    orders.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'created_at') {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return sortAsc ? dateA - dateB : dateB - dateA;
      }
      if (typeof valA === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    const total = orders.length;
    const from = (page - 1) * pageSize;
    const paginated = orders.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async getOrderById(id) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase getOrderById error:', err);
      }
    }

    const orders = localDB.getOrders();
    return orders.find(o => o.id === id) || null;
  },

  async createOrder(orderData) {
    const baseSubtotal = Number(orderData.base_subtotal) || 0;
    const premiumPercent = Number(orderData.buyers_premium_percent ?? 0.15);
    const buyersPremiumTotal = Number(orderData.buyers_premium_total ?? (baseSubtotal * premiumPercent));
    const totalSettlement = baseSubtotal + buyersPremiumTotal;

    const newOrder = {
      ...orderData,
      id: orderData.id || `ord-${Date.now().toString().slice(-4)}`,
      order_number: orderData.order_number || `HGS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      base_subtotal: baseSubtotal,
      buyers_premium_total: buyersPremiumTotal,
      total_settlement: totalSettlement,
      payment_status: orderData.payment_status || 'Pending',
      fulfillment_status: orderData.fulfillment_status || 'Awaiting Payment',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([newOrder])
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase createOrder error:', err);
        throw err;
      }
    }

    const orders = localDB.getOrders();
    const updated = [newOrder, ...orders];
    localDB.setOrders(updated);
    return newOrder;
  },

  async updateOrder(id, orderData) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase updateOrder error:', err);
        throw err;
      }
    }

    const orders = localDB.getOrders();
    const index = orders.findIndex(o => o.id === id || o.order_id === id || o.order_number === id);
    if (index === -1) throw new Error('Order not found');
    orders[index] = { ...orders[index], ...orderData };
    localDB.setOrders([...orders]);
    return orders[index];
  },

  async deleteOrder(id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Supabase deleteOrder error:', err);
        throw err;
      }
    }

    const orders = localDB.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    localDB.setOrders(filtered);
    return true;
  }
};

