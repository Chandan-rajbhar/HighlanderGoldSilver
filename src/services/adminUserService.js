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
        console.error('Supabase getAdminUsers error, falling back to local:', err);
      }
    }

    let users = localDB.getAdminUsers();
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
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .update(userData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase updateAdminUser error:', err);
        throw err;
      }
    }

    const users = localDB.getAdminUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Admin user not found');
    users[index] = { ...users[index], ...userData };
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

