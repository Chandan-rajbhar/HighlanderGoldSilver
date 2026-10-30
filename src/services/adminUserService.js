import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

const LIST_COLUMNS = 'id, name, email, role, title, status, location, last_login, created_at';

export const adminUserService = {
  async getAdminUsers({
    search = '',
    role = '',
    status = ''
  } = {}) {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('admin_users').select(LIST_COLUMNS);
        if (role && role !== 'All') query = query.eq('role', role);
        if (status && status !== 'All') query = query.eq('status', status);
        if (search && search.trim() !== '') {
          const s = search.trim();
          query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,title.ilike.%${s}%`);
        }
        const { data, error } = await query.order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Supabase getAdminUsers error:', err);
        return [];
      }
    }

    return [];
    if (role && role !== 'All') users = users.filter(u => u.role === role);
    if (status && status !== 'All') users = users.filter(u => u.status === status);
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      users = users.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.title.toLowerCase().includes(q)
      );
    }
    return users;
  },

  async createAdminUser(userData) {
    const newUser = {
      ...userData,
      id: userData.id || `adm-${Date.now().toString().slice(-4)}`,
      status: userData.status || 'Active',
      last_login: 'Never',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .insert([newUser])
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase createAdminUser error:', err);
        throw err;
      }
    }

    const users = localDB.getAdminUsers();
    const updated = [...users, newUser];
    localDB.setAdminUsers(updated);
    return newUser;
  },

  async updateAdminUser(id, userData) {
    const validFields = ['name', 'email', 'role', 'status', 'two_factor_enabled', 'title', 'location'];
    const cleanPayload = {};
    validFields.forEach(col => {
      if (userData[col] !== undefined) cleanPayload[col] = userData[col];
    });
    if (userData.full_name && !cleanPayload.name) cleanPayload.name = userData.full_name;
    if (userData.admin_role !== undefined) cleanPayload.role = userData.admin_role;
    if (userData.account_status && !cleanPayload.status) cleanPayload.status = userData.account_status;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .update(cleanPayload)
          .eq('id', id)
          .select();
        if (error) {
          console.warn('Supabase updateAdminUser warning, falling back to local:', error);
        } else if (data?.[0]) {
          const users = localDB.getAdminUsers();
          const idx = users.findIndex(u => u.id === id);
          if (idx !== -1) {
            users[idx] = { ...users[idx], ...data[0] };
            localDB.setAdminUsers([...users]);
          }
          return data[0];
        }
      } catch (err) {
        console.warn('Supabase updateAdminUser error, saving to localDB:', err);
      }
    }

    const users = localDB.getAdminUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      const fallbackAdmin = { id, ...cleanPayload };
      localDB.setAdminUsers([...users, fallbackAdmin]);
      return fallbackAdmin;
    }
    users[index] = { ...users[index], ...cleanPayload };
    localDB.setAdminUsers([...users]);
    return users[index];
  },

  async deleteAdminUser(id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('admin_users').delete().eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Supabase deleteAdminUser error:', err);
        throw err;
      }
    }

    const users = localDB.getAdminUsers();
    const filtered = users.filter(u => u.id !== id);
    localDB.setAdminUsers(filtered);
    return true;
  }
};

