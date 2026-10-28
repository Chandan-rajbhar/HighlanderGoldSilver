import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

const LIST_COLUMNS = 'id, code, description, discount_type, discount_value, minimum_order_amount, max_discount_amount, start_date, expiry_date, usage_limit, redemptions_count, status, created_at';

export const couponService = {
  async getCoupons({
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
          .from('coupons')
          .select(LIST_COLUMNS, { count: 'exact' });

        if (status && status !== 'All') {
          query = query.eq('status', status);
        }
        if (search && search.trim() !== '') {
          const s = search.trim();
          query = query.or(`code.ilike.%${s}%,description.ilike.%${s}%`);
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
        console.error('Supabase getCoupons error, using local fallback:', err);
      }
    }

    let cpns = localDB.getCoupons();

    if (status && status !== 'All') {
      cpns = cpns.filter(c => c.status === status);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      cpns = cpns.filter(c => 
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    cpns.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'created_at') {
        return sortAsc ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    const total = cpns.length;
    const from = (page - 1) * pageSize;
    const paginated = cpns.slice(from, from + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async getCouponMetrics() {
    const cpns = isSupabaseConfigured() ? [] : localDB.getCoupons();
    const totalCoupons = cpns.length;
    const activeCoupons = cpns.filter(c => c.status === 'Active').length;
    const totalRedemptions = cpns.reduce((sum, c) => sum + (Number(c.redemptions_count) || 0), 0);
    const avgDiscount = cpns.length > 0 
      ? Math.round(cpns.reduce((sum, c) => sum + (Number(c.discount_value) || 0), 0) / cpns.length) 
      : 0;

    return {
      totalCoupons,
      activeCoupons,
      totalRedemptions,
      avgDiscount
    };
  },

  async createCoupon(couponData) {
    const newCoupon = {
      ...couponData,
      id: couponData.id || `cpn-${Date.now().toString().slice(-4)}`,
      code: couponData.code.toUpperCase().trim(),
      discount_value: Number(couponData.discount_value) || 0,
      minimum_order_amount: Number(couponData.minimum_order_amount) || 0,
      usage_limit: Number(couponData.usage_limit) || 100,
      redemptions_count: 0,
      status: couponData.status || 'Active',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .insert([newCoupon])
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase createCoupon error:', err);
        throw err;
      }
    }

    const cpns = localDB.getCoupons();
    const updated = [newCoupon, ...cpns];
    localDB.setCoupons(updated);
    return newCoupon;
  },

  async updateCoupon(id, couponData) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase updateCoupon error:', err);
        throw err;
      }
    }

    const cpns = localDB.getCoupons();
    const index = cpns.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Coupon not found');
    cpns[index] = { ...cpns[index], ...couponData };
    localDB.setCoupons([...cpns]);
    return cpns[index];
  },

  async deleteCoupon(id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('coupons')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Supabase deleteCoupon error:', err);
        throw err;
      }
    }

    const cpns = localDB.getCoupons();
    const filtered = cpns.filter(c => c.id !== id);
    localDB.setCoupons(filtered);
    return true;
  }
};

