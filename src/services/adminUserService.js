import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';
import { getCachedAvatar, saveCachedAvatar } from '../utils/avatarStorage';

let _knownAdminColumns = null;

const isMissingColumnError = (err) => {
  const msg = String(err?.message || '').toLowerCase();
  return (
    err?.code === '42703' ||
    err?.code === 'PGRST204' ||
    msg.includes('column') ||
    msg.includes('schema cache')
  );
};

const syncKnownColumnsFromRows = (rows) => {
  if (Array.isArray(rows) && rows.length > 0 && rows[0] && typeof rows[0] === 'object') {
    _knownAdminColumns = new Set(Object.keys(rows[0]));
  }
  return _knownAdminColumns;
};

const ensureKnownAdminColumns = async () => {
  if (_knownAdminColumns) return _knownAdminColumns;
  try {
    const { data, error } = await supabase.from('admin_users').select('*').limit(1);
    if (!error) return syncKnownColumnsFromRows(data);
  } catch (_) {}
  return _knownAdminColumns;
};

export const adminUserService = {
  async getAdminUsers({
    search = '',
    role = '',
    status = ''
  } = {}) {
    if (isSupabaseConfigured()) {
      try {
        // Select '*' avoids 400 Bad Request errors when optional contact columns haven't been migrated yet
        let query = supabase.from('admin_users').select('*');
        if (role && role !== 'All') query = query.eq('role', role);
        if (status && status !== 'All') query = query.eq('status', status);
        if (search && search.trim() !== '') {
          const s = search.trim();
          query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,title.ilike.%${s}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: true });
        if (error) throw error;

        syncKnownColumnsFromRows(data);

        // Read live Supabase Auth user metadata as secondary source if admin_users.phone/city/state columns are not added yet
        let authUser = null;
        try {
          const { data: sessionRes } = await supabase.auth.getSession();
          if (sessionRes?.session?.user) {
            const { data: userRes } = await supabase.auth.getUser();
            authUser = userRes?.user || sessionRes.session.user;
          }
        } catch (_) {}

        return (data || []).map(item => {
          const isCurrentAuthAdmin = Boolean(
            authUser && (
              (item.auth_user_id && item.auth_user_id === authUser.id) ||
              (item.email && authUser.email && item.email.toLowerCase() === authUser.email.toLowerCase())
            )
          );
          const meta = isCurrentAuthAdmin ? (authUser.user_metadata || {}) : {};
          return {
            ...item,
            phone: item.phone !== undefined && item.phone !== null ? item.phone : (meta.phone ?? ''),
            city: item.city !== undefined && item.city !== null ? item.city : meta.city,
            state: item.state !== undefined && item.state !== null ? item.state : meta.state,
            avatar_url: item.avatar_url || getCachedAvatar(item.id, item.email) || ''
          };
        });
      } catch (err) {
        console.error('Supabase getAdminUsers error:', err);
        return [];
      }
    }

    let users = localDB.getAdminUsers() || [];
    if (role && role !== 'All') users = users.filter(u => u.role === role);
    if (status && status !== 'All') users = users.filter(u => u.status === status);
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      users = users.filter(u => 
        u.name?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q) || 
        u.title?.toLowerCase().includes(q)
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
    const validFields = ['name', 'email', 'role', 'status', 'two_factor_enabled', 'title', 'location', 'phone', 'city', 'state', 'avatar_url'];
    const cleanPayload = {};
    validFields.forEach(col => {
      if (userData[col] !== undefined) cleanPayload[col] = userData[col];
    });
    if (userData.full_name && !cleanPayload.name) cleanPayload.name = userData.full_name;
    if (userData.admin_role !== undefined) cleanPayload.role = userData.admin_role;
    if (userData.account_status && !cleanPayload.status) cleanPayload.status = userData.account_status;
    if ((cleanPayload.city !== undefined || cleanPayload.state !== undefined) && cleanPayload.location === undefined) {
      const c = String(cleanPayload.city || '').trim();
      const s = String(cleanPayload.state || '').trim();
      if (c || s) cleanPayload.location = c && s ? `${c}, ${s}` : (c || s);
    }
    if (cleanPayload.phone !== undefined) {
      cleanPayload.phone = String(cleanPayload.phone ?? '').trim();
    }

    let schemaMissingContactCols = false;

    if (isSupabaseConfigured()) {
      const executeUpdate = async (payloadToSend) => {
        let { data, error } = await supabase
          .from('admin_users')
          .update(payloadToSend)
          .eq('id', id)
          .select();

        if (!error && (!data || data.length === 0) && payloadToSend.email) {
          const retryRes = await supabase
            .from('admin_users')
            .update(payloadToSend)
            .ilike('email', payloadToSend.email)
            .select();
          data = retryRes.data;
          error = retryRes.error;
        }
        return { data, error };
      };

      try {
        const knownCols = await ensureKnownAdminColumns();
        let workingPayload = { ...cleanPayload, updated_at: new Date().toISOString() };

        // Pre-filter against discovered columns so unmigrated columns never cause 400 Bad Request console errors
        if (knownCols && knownCols.size > 0) {
          if (workingPayload.phone !== undefined && !knownCols.has('phone')) {
            schemaMissingContactCols = true;
          }
          for (const key of Object.keys(workingPayload)) {
            if (!knownCols.has(key)) {
              delete workingPayload[key];
            }
          }
        }

        let { data, error } = await executeUpdate(workingPayload);

        // Safety fallback if table had 0 rows on schema discovery
        const optionalCols = ['phone', 'city', 'state', 'avatar_url', 'updated_at'];
        for (let attempt = 0; attempt < optionalCols.length && error && isMissingColumnError(error); attempt++) {
          const msg = String(error.message || '').toLowerCase();
          let strippedAny = false;
          for (const col of optionalCols) {
            if (col in workingPayload && (msg.includes(col) || !optionalCols.some(c => msg.includes(c)))) {
              if (col === 'phone') schemaMissingContactCols = true;
              delete workingPayload[col];
              strippedAny = true;
              if (msg.includes(col)) break;
            }
          }
          if (!strippedAny) break;
          const retry = await executeUpdate(workingPayload);
          data = retry.data;
          error = retry.error;
        }

        if (error) throw error;

        // Also sync contact metadata to the currently signed-in admin's Supabase Auth user_metadata
        try {
          if (supabase?.auth?.getUser) {
            const { data: userRes } = await supabase.auth.getUser();
            const currentAuthUser = userRes?.user;
            const isSameAdmin = Boolean(
              currentAuthUser && (
                currentAuthUser.id === userData.auth_user_id ||
                (cleanPayload.email && currentAuthUser.email?.toLowerCase() === cleanPayload.email.toLowerCase()) ||
                (id && id === currentAuthUser.id) ||
                (!userData.auth_user_id && !cleanPayload.email)
              )
            );
            if (isSameAdmin) {
              const authMetaUpdate = {};
              if (cleanPayload.name !== undefined) authMetaUpdate.full_name = cleanPayload.name;
              if (cleanPayload.phone !== undefined) authMetaUpdate.phone = cleanPayload.phone;
              if (cleanPayload.city !== undefined) authMetaUpdate.city = cleanPayload.city;
              if (cleanPayload.state !== undefined) authMetaUpdate.state = cleanPayload.state;
              if (cleanPayload.location !== undefined) authMetaUpdate.location = cleanPayload.location;
              if (Object.keys(authMetaUpdate).length > 0) {
                await supabase.auth.updateUser({ data: authMetaUpdate });
              }
            }
          }
        } catch (_) {}

        if (cleanPayload.avatar_url) {
          saveCachedAvatar(id, cleanPayload.avatar_url, cleanPayload.email);
        }

        if (data?.[0]) {
          const users = localDB.getAdminUsers();
          const idx = users.findIndex(u => u.id === id || (cleanPayload.email && u.email?.toLowerCase() === cleanPayload.email.toLowerCase()));
          const merged = {
            ...data[0],
            phone: cleanPayload.phone !== undefined ? cleanPayload.phone : (data[0].phone ?? ''),
            city: cleanPayload.city !== undefined ? cleanPayload.city : data[0].city,
            state: cleanPayload.state !== undefined ? cleanPayload.state : data[0].state,
            avatar_url: cleanPayload.avatar_url ?? data[0].avatar_url,
            _schemaMissingContactCols: schemaMissingContactCols,
          };
          if (idx !== -1) {
            users[idx] = { ...users[idx], ...merged };
            localDB.setAdminUsers([...users]);
          }
          return merged;
        }
      } catch (err) {
        console.error('Supabase updateAdminUser error:', err);
        throw err;
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

