import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  UserCheck, 
  Lock, 
  MapPin, 
  Clock, 
  Edit3, 
  Trash2 
} from 'lucide-react';
import { adminUserService } from '../services/adminUserService';
import { DataTable } from '../components/ui/DataTable';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AdminUserFormModal } from '../components/forms/AdminUserFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export const AdminUsers = () => {
  const { toast } = useToast();

  const [adminUsers, setAdminUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminUserService.getAdminUsers({
        search,
        role: role !== 'All' ? role : ''
      });
      setAdminUsers(data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      toast.error('Failed to load administrator accounts.');
    } finally {
      setIsLoading(false);
    }
  }, [search, role, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (u) => {
    setSelectedUser(u);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (u) => {
    setSelectedUser(u);
    setIsConfirmOpen(true);
  };

  const handleSaveUser = async (formData) => {
    setIsSaving(true);
    try {
      if (selectedUser) {
        const updated = await adminUserService.updateAdminUser(selectedUser.id, formData);
        setAdminUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        toast.success(`Staff account for ${updated.name} updated!`);
      } else {
        const created = await adminUserService.createAdminUser(formData);
        setAdminUsers(prev => [...prev, created]);
        toast.success(`New staff role for ${created.name} provisioned!`);
      }
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error saving admin user:', err);
      toast.error('Failed to save administrator.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await adminUserService.deleteAdminUser(selectedUser.id);
      setAdminUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      toast.success(`Staff user ${selectedUser.name} removed.`);
      setIsConfirmOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting admin user:', err);
      toast.error('Failed to delete administrator.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      header: 'Staff Member',
      accessor: 'name',
      className: 'font-sans font-semibold text-slate-900',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-aubergine text-gold font-bold text-xs flex items-center justify-center shrink-0 border border-gold/40 shadow-sm">
            {row.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm block font-sans">{row.name}</span>
            <span className="text-[11px] text-slate-500 font-mono">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Administrative Role',
      accessor: 'role',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aubergine-surface text-aubergine border border-aubergine-border">
          <ShieldCheck className="w-3 h-3 text-gold" />
          {row.role}
        </span>
      )
    },
    {
      header: 'Department / Title',
      accessor: 'title',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.title || 'Vault Specialist'}
        </span>
      )
    },
    {
      header: 'Assigned Location',
      accessor: 'location',
      render: (row) => (
        <span className="text-xs text-slate-600 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          {row.location}
        </span>
      )
    },
    {
      header: 'Last Active',
      accessor: 'last_login',
      className: 'text-xs text-slate-500 font-mono whitespace-nowrap',
      render: (row) => (
        <span>{row.last_login.includes('T') ? new Date(row.last_login).toLocaleDateString() : row.last_login}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          row.status === 'Active' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900">
            Admin Users & Roles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Internal staff credentials, RBAC security roles, and console authorization.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-aubergine hover:bg-aubergine-light text-white text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-gold" />
          Provision Staff Member
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={adminUsers}
        total={adminUsers.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search staff name, email, or role..."
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        editLabel="Edit Role"
        emptyTitle="No administrator records"
        emptyDescription="Provision staff accounts to assign inventory or order management roles."
        filterComponent={
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Inventory Manager">Inventory Manager</option>
            <option value="Order Manager">Order Manager</option>
          </Select>
        }
      />

      <AdminUserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
        initialData={selectedUser}
        isLoading={isSaving}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Revoke Staff Access"
        message={`Are you sure you want to delete administrator access for "${selectedUser?.name}"?`}
        confirmText="Revoke Access"
        isLoading={isSaving}
      />
    </div>
  );
};

