import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

export const dashboardService = {
  /**
   * Fetches unified dashboard metrics in a single aggregated operation
   * Egress optimization: avoids separate network queries
   */
  async getDashboardSummary() {
    if (isSupabaseConfigured()) {
      try {
        const [
          inventoryRes,
          ordersRes,
          customersRes,
          inquiriesRes,
          categoriesRes,
          paymentsRes
        ] = await Promise.all([
          supabase.from('inventory').select('id, price, status, stock_status, storefront_status, show_on_storefront, category, metal, stock_quantity'),
          supabase.from('orders').select('id, order_number, customer_name, total_settlement, payment_status, created_at').order('created_at', { ascending: false }),
          supabase.from('customers').select('id, total_spent', { count: 'exact' }),
          supabase.from('inquiries').select('id, status', { count: 'exact' }),
          supabase.from('categories').select('id, name'),
          supabase.from('payments').select('id, amount, payment_status')
        ]);

        const items = inventoryRes.data || [];
        const allOrders = ordersRes.data || [];
        const recentOrders = allOrders.slice(0, 5);
        const customersCount = customersRes.count || 0;
        const totalInquiries = inquiriesRes.count || 0;
        const newInquiries = (inquiriesRes.data || []).filter(i => i.status === 'New').length;
        const payments = paymentsRes.data || [];

        const totalItems = items.length;
        const activeItems = items.filter(i => 
          (i.storefront_status === 'Active' || i.status === 'Available') && 
          i.show_on_storefront !== false
        ).length;
        const lowStockItems = items.filter(i => 
          i.stock_status === 'Out of Stock' || 
          i.stock_status === 'Low Stock' || 
          i.status === 'Unavailable' || 
          (i.stock_quantity ?? 1) <= 1
        ).length;

        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total_settlement) || 0), 0);
        const pendingPayments = payments.filter(p => p.payment_status === 'Pending' || p.payment_status === 'Pending Wire').length ||
          allOrders.filter(o => o.payment_status === 'Pending' || o.payment_status === 'Pending Wire').length;

        // Base Catalog Valuation
        const baseCatalogValue = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        const buyerPremiumTotal = baseCatalogValue * 0.15; // 15% standard HGS buyer's premium
        const totalSettlementValuation = baseCatalogValue + buyerPremiumTotal;

        // Category breakdown
        const categoryMap = {};
        items.forEach(item => {
          const cat = item.category || 'Other';
          if (!categoryMap[cat]) categoryMap[cat] = { count: 0, value: 0 };
          categoryMap[cat].count += 1;
          categoryMap[cat].value += (Number(item.price) || 0);
        });

        const categoryBreakdown = Object.keys(categoryMap).map(name => ({
          name,
          count: categoryMap[name].count,
          value: categoryMap[name].value
        }));

        // Metal breakdown
        const metalMap = {};
        items.forEach(item => {
          const m = item.metal || 'Other';
          metalMap[m] = (metalMap[m] || 0) + 1;
        });

        const metalBreakdown = Object.keys(metalMap).map(metal => ({
          name: metal,
          count: metalMap[metal]
        }));

        return {
          totalItems,
          activeItems,
          totalCategories: categoriesRes.data?.length || Object.keys(categoryMap).length,
          totalCustomers: customersCount,
          totalOrders,
          totalRevenue,
          pendingPayments,
          lowStockItems,
          lowStockOrUnavailable: lowStockItems,
          totalInquiries,
          newInquiries,
          baseCatalogValue,
          buyerPremiumTotal,
          totalSettlementValuation,
          recentOrders,
          categoryBreakdown,
          metalBreakdown,
          isLiveConnected: true
        };
      } catch (err) {
        console.error('Supabase getDashboardSummary error, falling back to local:', err);
      }
    }

    // Local DB calculation
    const items = localDB.getInventory();
    const categories = localDB.getCategories();
    const customers = localDB.getCustomers();
    const orders = localDB.getOrders();
    const payments = localDB.getPayments();
    const inquiries = localDB.getInquiries();

    const totalItems = items.length;
    const activeItems = items.filter(i => 
      (i.storefront_status === 'Active' || i.status === 'Available') && 
      i.show_on_storefront !== false
    ).length;
    const lowStockItems = items.filter(i => 
      i.stock_status === 'Out of Stock' || 
      i.stock_status === 'Low Stock' || 
      i.status === 'Unavailable' || 
      (i.stock_quantity ?? 1) <= 1
    ).length;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_settlement) || 0), 0);
    const pendingPayments = payments.filter(p => p.payment_status === 'Pending' || p.payment_status === 'Pending Wire').length ||
      orders.filter(o => o.payment_status === 'Pending' || o.payment_status === 'Pending Wire').length;

    const baseCatalogValue = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const buyerPremiumTotal = baseCatalogValue * 0.15;
    const totalSettlementValuation = baseCatalogValue + buyerPremiumTotal;

    // Categories
    const categoryMap = {};
    items.forEach(item => {
      const cat = item.category || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, value: 0 };
      categoryMap[cat].count += 1;
      categoryMap[cat].value += (Number(item.price) || 0);
    });

    const categoryBreakdown = Object.keys(categoryMap).map(name => ({
      name,
      count: categoryMap[name].count,
      value: categoryMap[name].value
    }));

    // Metals
    const metalMap = {};
    items.forEach(item => {
      const m = item.metal || 'Other';
      metalMap[m] = (metalMap[m] || 0) + 1;
    });

    const metalBreakdown = Object.keys(metalMap).map(metal => ({
      name: metal,
      count: metalMap[metal]
    }));

    // Recent orders
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    const newInquiries = inquiries.filter(i => i.status === 'New').length;

    return {
      totalItems,
      activeItems,
      totalCategories: categories.length,
      totalCustomers: customers.length,
      totalOrders,
      totalRevenue,
      pendingPayments,
      lowStockItems,
      lowStockOrUnavailable: lowStockItems,
      totalInquiries,
      newInquiries,
      baseCatalogValue,
      buyerPremiumTotal,
      totalSettlementValuation,
      recentOrders,
      categoryBreakdown,
      metalBreakdown,
      isLiveConnected: isSupabaseConfigured()
    };
  }
};
