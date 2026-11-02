import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';
import { getCachedAvatar, saveCachedAvatar } from '../utils/avatarStorage';

const LIST_COLUMNS = 'id, name, email, role, title, status, location, last_login, created_at, avatar_url';
const LIST_COLUMNS_FALLBACK = 'id, name, email, role, title, status, location, last_login, created_at';

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
        let { data, error } = await query.order('created_at', { ascending: true });
        if (error && (error.message?.includes('avatar_url') || error.code === '42703' || error.code === 'PGRST204')) {
          let fallbackQuery = supabase.from('admin_users').select(LIST_COLUMNS_FALLBACK);
          if (role && role !== 'All') fallbackQuery = fallbackQuery.eq('role', role);
          if (status && status !== 'All') fallbackQuery = fallbackQuery.eq('status', status);
          if (search && search.trim() !== '') {
            const s = search.trim();
            fallbackQuery = fallbackQuery.or(`name.ilike.%${s}%,email.ilike.%${s}%,title.ilike.%${s}%`);
          }
          const fallbackRes = await fallbackQuery.order('created_at', { ascending: true });
          data = fallbackRes.data;
          error = fallbackRes.error;
        }
        if (error) throw error;
        return (data || []).map(item => ({
          ...item,
          avatar_url: item.avatar_url || getCachedAvatar(item.id, item.email) || ''
        }));
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
    const validFields = ['name', 'email', 'role', 'status', 'two_factor_enabled', 'title', 'location', 'avatar_url'];
    const cleanPayload = {};
    validFields.forEach(col => {
      if (userData[col] !== undefined) cleanPayload[col] = userData[col];
    });
    if (userData.full_name && !cleanPayload.name) cleanPayload.name = userData.full_name;
    if (userData.admin_role !== undefined) cleanPayload.role = userData.admin_role;
    if (userData.account_status && !cleanPayload.status) cleanPayload.status = userData.account_status;

    if (isSupabaseConfigured()) {
      try {
        let { data, error } = await supabase
          .from('admin_users')
          .update(cleanPayload)
          .eq('id', id)
          .select();

        // If no rows matched by id and email was provided, try matching by email
        if (!error && (!data || data.length === 0) && cleanPayload.email) {
          const retryRes = await supabase
            .from('admin_users')
            .update(cleanPayload)
            .ilike('email', cleanPayload.email)
            .select();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error && (error.message?.includes('avatar_url') || error.code === '42703' || error.code === 'PGRST204')) {
          const { avatar_url, ...fallbackPayload } = cleanPayload;
          let retryRes = await supabase.from('admin_users').update(fallbackPayload).eq('id', id).select();
          if (!retryRes.error && (!retryRes.data || retryRes.data.length === 0) && cleanPayload.email) {
            retryRes = await supabase.from('admin_users').update(fallbackPayload).ilike('email', cleanPayload.email).select();
          }
          data = retryRes.data;
        }

        // Also update Supabase Auth user metadata if logged in
        try {
          if (cleanPayload.avatar_url && supabase?.auth?.getUser) {
            await supabase.auth.updateUser({
              data: {
                avatar_url: cleanPayload.avatar_url,
                full_name: cleanPayload.name
              }
            });
          }
        } catch (_) {}

        if (cleanPayload.avatar_url) {
          saveCachedAvatar(id, cleanPayload.avatar_url, cleanPayload.email);
        }

        if (data?.[0]) {
          const users = localDB.getAdminUsers();
          const idx = users.findIndex(u => u.id === id || (cleanPayload.email && u.email?.toLowerCase() === cleanPayload.email.toLowerCase()));
          const merged = { ...data[0], avatar_url: cleanPayload.avatar_url ?? data[0].avatar_url };
          if (idx !== -1) {
            users[idx] = { ...users[idx], ...merged };
            localDB.setAdminUsers([...users]);
          }
          return merged;
        }
      } catch (err) {
        console.warn('Supabase updateAdminUser error, saving to localDB:', err);
      }
    }

    if (cleanPayload.avatar_url) {
      saveCachedAvatar(id, cleanPayload.avatar_url, cleanPayload.email);
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

