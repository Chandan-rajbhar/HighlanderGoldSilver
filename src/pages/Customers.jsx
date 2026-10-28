import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  User,
  ShieldCheck,
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Calendar,
  Eye, 
  Edit3, 
  Trash2, 
  MoreVertical,
  X,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { adminUserService } from '../services/adminUserService';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CustomerFormModal } from '../components/forms/CustomerFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export const Customers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All'); // 'All' | 'Customer' | 'Admin'
  const [roleCounts, setRoleCounts] = useState({ all: 0, customers: 0, admins: 0 });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [custRes, adminRes] = await Promise.all([
        customerService.getCustomers({
          page: 1,
          pageSize: 500,
          search: '',
          tier: '',
          sortBy: 'created_at',
          sortAsc: false
        }),
        adminUserService.getAdminUsers({ search: '' })
      ]);

      // Normalize customers
      const custList = (custRes.data || []).map(c => ({
        ...c,
        id: c.id,
        full_name: c.full_name,
        email: c.email,
        phone: c.phone || '',
        city: c.city || 'Bigfork',
        state: c.state || 'MT',
        customer_id: c.customer_id || `CUST-${c.id?.slice(-4).toUpperCase() || '1000'}`,
        role: 'Customer',
        is_admin: false,
        account_status: c.account_status || 'Active',
        orders_count: c.orders_count || 0,
        total_spent: c.total_spent || 0,
        tier: c.tier || 'Collector',
        created_at: c.created_at || '2026-09-01T00:00:00Z'
      }));

      // Normalize admins
      const adminList = (adminRes || []).map(a => ({
        ...a,
        id: a.id,
        full_name: a.name,
        email: a.email,
        phone: a.phone || '(406) 883-2210',
        city: a.location ? a.location.split(' ')[0] : 'Bigfork',
        state: 'MT',
        customer_id: `STAFF-${a.id?.replace('adm-', '00').toUpperCase() || '001'}`,
        role: 'Admin',
        admin_role: a.role || 'Super Admin',
        title: a.title || 'Senior Numismatist & Vault Director',
        is_admin: true,
        account_status: a.status || 'Active',
        orders_count: 0,
        total_spent: 0,
        created_at: a.created_at || '2026-01-10T00:00:00Z'
      }));

      const allUsers = [...adminList, ...custList];

      setRoleCounts({
        all: allUsers.length,
        customers: custList.length,
        admins: adminList.length
      });

      // Filter by role
      let filtered = allUsers;
      if (roleFilter === 'Admin') {
        filtered = filtered.filter(u => u.is_admin);
      } else if (roleFilter === 'Customer') {
        filtered = filtered.filter(u => !u.is_admin);
      }

      // Filter by status
      if (statusFilter !== 'All') {
        filtered = filtered.filter(u => (u.account_status || 'Active') === statusFilter);
      }

      // Filter by search
      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(u => 
          (u.full_name && u.full_name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.customer_id && u.customer_id.toLowerCase().includes(q)) ||
          (u.title && u.title.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q))
        );
      }

      // Sort
      filtered.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (sortBy === 'created_at') {
          return sortAsc ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
        }
        if (sortBy === 'orders_count' || sortBy === 'total_spent') {
          return sortAsc ? Number(valA || 0) - Number(valB || 0) : Number(valB || 0) - Number(valA || 0);
        }
        return sortAsc ? String(valA || '').localeCompare(String(valB || '')) : String(valB || '').localeCompare(String(valA || ''));
      });

      // Pagination
      const totalCount = filtered.length;
      const from = (page - 1) * pageSize;
      const paginated = filtered.slice(from, from + pageSize);

      setUsers(paginated);
      setTotal(totalCount);
      setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
    } catch (err) {
      console.error('Error fetching users directory:', err);
      toast.error('Failed to load users directory.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, roleFilter, sortBy, sortAsc, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(columnKey);
      setSortAsc(true);
    }
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeletePrompt = (user) => {
    setSelectedUser(user);
    setIsConfirmOpen(true);
  };

  const handleSaveUser = async (formData) => {
    setIsSaving(true);
    try {
      if (formData.role === 'Admin') {
        if (selectedUser && selectedUser.is_admin) {
          await adminUserService.updateAdminUser(selectedUser.id, {
            name: formData.full_name,
            email: formData.email,
            role: formData.admin_role || 'Super Admin',
            title: formData.title || 'Administrative Staff',
            status: formData.account_status,
            location: `${formData.city}, ${formData.state}`
          });
          toast.success(`Admin user "${formData.full_name}" updated!`);
        } else {
          await adminUserService.createAdminUser({
            name: formData.full_name,
            email: formData.email,
            role: formData.admin_role || 'Super Admin',
            title: formData.title || 'Administrative Staff',
            status: formData.account_status,
            location: `${formData.city}, ${formData.state}`
          });
          toast.success(`New admin user "${formData.full_name}" provisioned!`);
        }
      } else {
        if (selectedUser && !selectedUser.is_admin) {
          const updated = await customerService.updateCustomer(selectedUser.id, formData);
          toast.success(`Customer "${updated.full_name}" updated!`);
        } else {
          const created = await customerService.createCustomer(formData);
          toast.success(`Customer "${created.full_name}" registered!`);
        }
      }
      setIsFormOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error saving user profile:', err);
      toast.error('Failed to save user profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      if (selectedUser.is_admin) {
        await adminUserService.deleteAdminUser(selectedUser.id);
        toast.success(`Admin user "${selectedUser.full_name}" removed.`);
      } else {
        await customerService.deleteCustomer(selectedUser.id);
        toast.success(`Customer "${selectedUser.full_name}" deleted.`);
      }
      setIsConfirmOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      header: 'User Name',
      accessor: 'full_name',
      className: 'font-serif font-semibold text-slate-900',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${
            row.is_admin 
              ? 'bg-[#0B2348] text-[#C9A23A] border-[#C9A23A]/50 font-bold' 
              : 'bg-aubergine text-gold border-gold/40 font-bold'
          } text-xs flex items-center justify-center shrink-0 border shadow-xs`}>
            {row.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || (row.is_admin ? 'AD' : 'CU')}
          </div>
          <div>
            <button
              onClick={() => setViewUser(row)}
              className="font-bold text-slate-900 text-sm hover:text-gold block text-left"
            >
              {row.full_name}
            </button>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {row.city || 'Bigfork'}, {row.state || 'MT'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <div className="flex flex-col text-xs">
          <a href={`mailto:${row.email}`} className="text-slate-800 hover:text-aubergine font-medium">
            {row.email}
          </a>
          {row.phone && (
            <a href={`tel:${row.phone}`} className="text-slate-500 hover:text-slate-700 text-[11px]">
              {row.phone}
            </a>
          )}
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => {
        if (row.is_admin || row.role === 'Admin') {
          return (
            <div className="flex flex-col gap-0.5 items-start">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                Admin
              </span>
              {row.admin_role && (
                <span className="text-[10px] text-slate-500 font-mono pl-1">
                  {row.admin_role}
                </span>
              )}
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-0.5 items-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              Customer
            </span>
            {row.tier && row.tier !== 'Customer' && (
              <span className="text-[10px] text-slate-500 font-mono pl-1">
                {row.tier}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'User ID',
      accessor: 'customer_id',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold border ${
          row.is_admin 
            ? 'bg-purple-50 text-purple-800 border-purple-200' 
            : 'bg-slate-100 text-slate-800 border-slate-200'
        }`}>
          {row.customer_id}
        </span>
      )
    },
    {
      header: 'Registration Date',
      accessor: 'created_at',
      className: 'text-xs text-slate-600',
      render: (row) => (
        <span className="text-slate-600">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Oct 2026'}
        </span>
      )
    },
    {
      header: 'Total Orders',
      accessor: 'orders_count',
      className: 'font-mono text-center',
      render: (row) => {
        if (row.is_admin) {
          return (
            <div className="text-center">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
                Internal Staff
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[130px] mx-auto">
                {row.title || 'Console Access'}
              </span>
            </div>
          );
        }
        return (
          <div>
            <span className="font-bold text-slate-900 text-sm block">
              {row.orders_count || 0} order(s)
            </span>
            <span className="text-[10px] text-slate-500 font-sans">
              ${Number(row.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Account Status',
      accessor: 'account_status',
      render: (row) => {
        const st = row.account_status || 'Active';
        const isAct = st === 'Active';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            isAct
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {st}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#111827]">
            Users & Collectors
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Manage storefront registered collectors, buyer profiles, and administrative staff roles.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] hover:bg-[#1E293B] text-white text-xs font-bold font-serif uppercase tracking-wider transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D6AD45]" />
          Add User
        </button>
      </div>

      {/* Role Segmentation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DCE5F0] pb-3">
        <button
          onClick={() => {
            setRoleFilter('All');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            roleFilter === 'All'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#64748B] hover:bg-[#F5F8FC] border border-[#DCE5F0]'
          }`}
        >
          <span>All Users</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            roleFilter === 'All' ? 'bg-[#D6AD45] text-[#111827] font-bold' : 'bg-[#F5F8FC] text-[#64748B]'
          }`}>
            {roleCounts.all}
          </span>
        </button>

        <button
          onClick={() => {
            setRoleFilter('Customer');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            roleFilter === 'Customer'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#64748B] hover:bg-[#F5F8FC] border border-[#DCE5F0]'
          }`}
        >
          <User className="w-3.5 h-3.5 text-blue-500" />
          <span>Customers</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            roleFilter === 'Customer' ? 'bg-[#D6AD45] text-[#111827] font-bold' : 'bg-[#F5F8FC] text-[#64748B]'
          }`}>
            {roleCounts.customers}
          </span>
        </button>

        <button
          onClick={() => {
            setRoleFilter('Admin');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            roleFilter === 'Admin'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#64748B] hover:bg-[#F5F8FC] border border-[#DCE5F0]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
          <span>Admins</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            roleFilter === 'Admin' ? 'bg-[#D6AD45] text-[#111827] font-bold' : 'bg-[#F5F8FC] text-[#64748B]'
          }`}>
            {roleCounts.admins}
          </span>
        </button>
      </div>

      {/* Dynamic Data Table */}
      <DataTable
        columns={columns}
        data={users}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSort={handleSort}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, role, or User ID..."
        isLoading={isLoading}
        onView={setViewUser}
        onEdit={handleEdit}
        onDelete={handleDeletePrompt}
        editLabel="Edit User"
        emptyTitle="No users found"
        emptyDescription="No users match your active search or role criteria."
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-aubergine focus:outline-none"
            >
              <option value="All">All Roles</option>
              <option value="Customer">Customers Only</option>
              <option value="Admin">Admins Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-aubergine focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>
        }
      />

      {/* User Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
        initialData={selectedUser}
        isLoading={isSaving}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${selectedUser?.is_admin ? 'Admin User' : 'Customer'} Profile`}
        message={`Are you sure you want to delete the record for "${selectedUser?.full_name}"? This action cannot be undone.`}
        confirmText="Delete Record"
        isLoading={isSaving}
      />

      {/* Right-Side Slide-Over Drawer for User Details */}
      {viewUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setViewUser(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${
                    viewUser.is_admin ? 'bg-[#0B2348] text-[#C9A23A] border-[#C9A23A]/50' : 'bg-aubergine text-gold border-gold/40'
                  } font-bold text-sm flex items-center justify-center border shadow-xs`}>
                    {viewUser.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || (viewUser.is_admin ? 'AD' : 'CU')}
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-serif text-slate-900">
                      {viewUser.full_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-500">
                        {viewUser.customer_id}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        viewUser.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {viewUser.is_admin ? `Admin • ${viewUser.admin_role || 'Staff'}` : 'Customer'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setViewUser(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans mb-3">
                    Contact & Account Information
                  </h4>
                  <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${viewUser.email}`} className="text-aubergine hover:underline font-medium">
                        {viewUser.email}
                      </a>
                    </div>
                    {viewUser.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{viewUser.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">{viewUser.city || 'Bigfork'}, {viewUser.state || 'MT'}</span>
                    </div>
                  </div>
                </div>

                {viewUser.is_admin ? (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans mb-3">
                      Administrative Role & Privileges
                    </h4>
                    <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-900 font-medium">RBAC Security Role</span>
                        <span className="font-bold text-xs text-purple-800 bg-white px-2.5 py-0.5 rounded border border-purple-200">
                          {viewUser.admin_role || 'Super Admin'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-900 font-medium">Department / Title</span>
                        <span className="text-xs text-slate-700 font-medium">
                          {viewUser.title || 'Senior Numismatist & Vault Director'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-900 font-medium">Assigned Location</span>
                        <span className="text-xs text-slate-700">
                          {viewUser.location || `${viewUser.city}, ${viewUser.state}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans mb-3">
                      Purchasing & Order Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs text-slate-500 block">Total Orders</span>
                        <span className="text-lg font-bold font-mono text-slate-900">
                          {viewUser.orders_count || 0}
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs text-slate-500 block">Total Spent</span>
                        <span className="text-lg font-bold font-mono text-aubergine">
                          ${Number(viewUser.total_spent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {viewUser.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans mb-2">
                      Collector Notes & Preferences
                    </h4>
                    <p className="text-xs text-slate-700 p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl leading-relaxed">
                      {viewUser.notes}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans mb-3">
                    Account Status
                  </h4>
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-medium text-slate-600">Current Status</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {viewUser.account_status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setViewUser(null);
                    handleEdit(viewUser);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit User
                </button>
                {!viewUser.is_admin && (
                  <button
                    onClick={() => {
                      setViewUser(null);
                      navigate('/orders');
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-aubergine text-white text-xs font-semibold hover:bg-aubergine-light"
                  >
                    <ShoppingBag className="w-4 h-4 text-gold" />
                    View Orders
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
