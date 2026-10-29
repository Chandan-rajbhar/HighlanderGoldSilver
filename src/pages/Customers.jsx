import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  User,
  ShieldCheck,
  Shield,
  Key,
  Lock,
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
  Briefcase,
  ArrowLeft,
  RefreshCw,
  Ban,
  CheckCircle2,
  Copy,
  DollarSign,
  MessageSquare,
  Package,
  Clock,
  ChevronRight,
  FileText
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { adminUserService } from '../services/adminUserService';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { inquiryService } from '../services/inquiryService';
import { DataTable } from '../components/ui/DataTable';
import { Select } from '../components/ui/Select';
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
  const [sortBy, setSortBy] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Stats Counters
  const [roleCounts, setRoleCounts] = useState({ all: 0, customers: 0, admins: 0 });

  // Modal / Drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Full Profile View state
  const [viewUser, setViewUser] = useState(null);
  const [profileTab, setProfileTab] = useState('overview'); // 'overview' | 'orders' | 'payments' | 'inquiries' | 'permissions' | 'audit'
  const [userOrders, setUserOrders] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [userInquiries, setUserInquiries] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Fetch Users & Admin Staff combined
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
        full_name: c.name || c.full_name || 'Collector',
        email: c.email,
        phone: c.phone || '',
        city: c.city || 'Bigfork',
        state: c.state || 'MT',
        address: c.address || 'Highlander Secured Depository, Bigfork, MT',
        customer_id: c.customer_id || `CUST-${c.id?.slice(-4).toUpperCase() || '1000'}`,
        role: 'Customer',
        is_admin: false,
        account_status: c.account_status || 'Active',
        orders_count: c.orders_count || 0,
        total_spent: c.total_spent || 0,
        tier: c.tier || 'Collector',
        notes: c.notes || 'Prefers insured overnight bullion transport and direct wire clearance.',
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
        address: 'Highlander Vault HQ, Montana',
        customer_id: `STAFF-${a.id?.replace('adm-', '00').toUpperCase() || '001'}`,
        role: 'Admin',
        admin_role: a.role || 'Super Admin',
        title: a.title || 'Senior Numismatist & Vault Director',
        is_admin: true,
        account_status: a.status || 'Active',
        orders_count: 0,
        total_spent: 0,
        notes: 'Full administrative access and cryptographic vault keyholder authority.',
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

  // Load related profile data whenever a user is selected
  useEffect(() => {
    if (!viewUser) return;
    setIsLoadingProfile(true);
    setProfileTab('overview');

    Promise.all([
      orderService.getOrders({ pageSize: 100 }).catch(() => ({ data: [] })),
      paymentService.getPayments({ pageSize: 100 }).catch(() => ({ data: [] })),
      inquiryService.getInquiries({ pageSize: 100 }).catch(() => ({ data: [] }))
    ]).then(([ordersRes, paymentsRes, inqRes]) => {
      const allOrders = ordersRes.data || [];
      const allPayments = paymentsRes.data || [];
      const allInquiries = inqRes.data || [];

      const uEmail = (viewUser.email || '').toLowerCase().trim();
      const uName = (viewUser.full_name || '').toLowerCase().trim();

      const matchedOrders = allOrders.filter(o => 
        (o.customer_email && o.customer_email.toLowerCase().trim() === uEmail) ||
        (o.customer_name && o.customer_name.toLowerCase().trim() === uName)
      );

      const matchedPayments = allPayments.filter(p => 
        (p.customer_email && p.customer_email.toLowerCase().trim() === uEmail) ||
        (p.customer_name && p.customer_name.toLowerCase().trim() === uName)
      );

      const matchedInquiries = allInquiries.filter(i => 
        (i.email && i.email.toLowerCase().trim() === uEmail) ||
        (i.name && i.name.toLowerCase().trim() === uName)
      );

      setUserOrders(matchedOrders);
      setUserPayments(matchedPayments);
      setUserInquiries(matchedInquiries);
    }).finally(() => {
      setIsLoadingProfile(false);
    });
  }, [viewUser]);

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
      if (selectedUser) {
        if (selectedUser.is_admin) {
          await adminUserService.updateAdminUser(selectedUser.id, formData);
        } else {
          await customerService.updateCustomer(selectedUser.id, formData);
        }
        toast.success(`User "${formData.full_name || formData.name}" updated successfully!`);

        // Real-time update of currently open profile view
        if (viewUser && (viewUser.id === selectedUser.id || viewUser.customer_id === selectedUser.customer_id)) {
          setViewUser(prev => ({
            ...prev,
            ...formData,
            full_name: formData.full_name || formData.name || prev.full_name,
            name: formData.full_name || formData.name || prev.name,
            email: formData.email !== undefined ? formData.email : prev.email,
            phone: formData.phone !== undefined ? formData.phone : prev.phone,
            city: formData.city !== undefined ? formData.city : prev.city,
            state: formData.state !== undefined ? formData.state : prev.state,
            location: formData.location || `${formData.city || 'Bigfork'}, ${formData.state || 'MT'}`,
            role: formData.role || prev.role,
            admin_role: formData.admin_role || prev.admin_role,
            title: formData.title || prev.title,
            department: formData.department || prev.department,
            tier: formData.tier || prev.tier,
            account_status: formData.account_status || prev.account_status,
            notes: formData.notes !== undefined ? formData.notes : prev.notes,
            address: formData.address !== undefined ? formData.address : prev.address
          }));
        }
      } else {
        await customerService.createCustomer({
          name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          tier: formData.tier || 'Collector',
          account_status: formData.account_status || 'Active'
        });
        toast.success(`User "${formData.full_name}" registered!`);
      }
      setIsFormOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error('Failed to save user record.');
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
      } else {
        await customerService.deleteCustomer(selectedUser.id);
      }
      toast.success(`User "${selectedUser.full_name}" removed.`);
      setIsConfirmOpen(false);
      setSelectedUser(null);
      if (viewUser && (viewUser.id === selectedUser.id || viewUser.customer_id === selectedUser.customer_id)) {
        setViewUser(null);
      }
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!viewUser) return;
    const newStatus = viewUser.account_status === 'Active' ? 'Suspended' : 'Active';
    try {
      if (viewUser.is_admin) {
        await adminUserService.updateAdminUser(viewUser.id, { status: newStatus });
      } else {
        await customerService.updateCustomer(viewUser.id, { account_status: newStatus });
      }
      setViewUser(prev => ({ ...prev, account_status: newStatus }));
      setUsers(prev => prev.map(u => u.id === viewUser.id ? { ...u, account_status: newStatus } : u));
      toast.success(`Account marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update account status');
    }
  };

  // Table Columns (TOTAL ORDERS COLUMN REMOVED AS REQUESTED)
  const columns = [
    {
      header: 'USER NAME',
      accessor: 'full_name',
      className: 'font-semibold',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${
            row.is_admin 
              ? 'bg-[#071A35] text-[#C9A23A] border-[#C9A23A]/50 font-bold' 
              : 'bg-[#F5F8FC] text-[#071A35] border-[#DCE5F0] font-bold'
          } text-xs flex items-center justify-center shrink-0 border shadow-2xs font-sans`}>
            {row.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || (row.is_admin ? 'AD' : 'CU')}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm hover:text-[#C9A23A] transition-colors block text-left">
              {row.full_name}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <MapPin className="w-3 h-3 text-slate-400" />
              {row.city || 'Bigfork'}, {row.state || 'MT'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'EMAIL',
      accessor: 'email',
      className: 'text-xs text-slate-800 font-medium font-sans',
      render: (row) => <span>{row.email}</span>
    },
    {
      header: 'ROLE',
      accessor: 'role',
      render: (row) => {
        if (row.is_admin || row.role === 'Admin') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              Admin
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            Customer
          </span>
        );
      }
    },
    {
      header: 'USER ID',
      accessor: 'customer_id',
      className: 'font-mono text-xs font-semibold text-slate-700',
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
          {row.customer_id}
        </span>
      )
    },
    {
      header: 'REGISTRATION DATE',
      accessor: 'created_at',
      className: 'text-xs text-slate-500 font-mono whitespace-nowrap',
      render: (row) => <span>{new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    },
    {
      header: 'ACCOUNT STATUS',
      accessor: 'account_status',
      render: (row) => <StatusBadge status={row.account_status || 'Active'} />
    }
  ];

  // ==========================================
  // RENDER: DEDICATED ADMIN & STAFF PROFILE
  // ==========================================
  const renderAdminProfile = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Navigation & Action Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewUser(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F0] hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Users</span>
            </button>
            <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <span>Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span>Users</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-800 font-semibold">Administrative Staff Profile</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchUsers();
                toast.success('Admin profile synced with vault authority records');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F0] hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                viewUser.account_status === 'Active'
                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {viewUser.account_status === 'Active' ? (
                <>
                  <Ban className="w-3.5 h-3.5 text-amber-600" />
                  <span>Deactivate Account</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Activate Account</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleEdit(viewUser)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071A35] hover:bg-[#0B2548] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#C9A23A]" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-[#DCE5F0] p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: Avatar & Identity Details */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#071A35] border-2 border-[#C9A23A] text-[#C9A23A] text-xl font-bold flex items-center justify-center shadow-sm shrink-0 font-sans">
                {viewUser.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold font-sans text-slate-900">
                    {viewUser.full_name}
                  </h1>
                  <StatusBadge status={viewUser.account_status || 'Active'} />
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                    Admin &bull; {viewUser.admin_role || 'Super Admin'}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    2FA Enforced
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-semibold text-slate-700">STAFF ID:</span>
                    <span>{viewUser.customer_id}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(viewUser.customer_id);
                        toast.success('Staff ID copied');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Copy Staff ID"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{viewUser.email}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewUser.phone || '(406) 883-2210'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewUser.location || `${viewUser.city || 'Bigfork'}, MT`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Top 3 Stat Tiles for Admin */}
            <div className="flex items-center gap-3">
              <div className="px-5 py-3 rounded-xl bg-[#F5F8FC] border border-[#DCE5F0] text-center min-w-[130px]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  CLEARANCE LEVEL
                </span>
                <span className="text-sm font-bold font-sans text-purple-700 mt-1 block flex items-center justify-center gap-1">
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  Level 3 Vault
                </span>
              </div>

              <div className="px-5 py-3 rounded-xl bg-[#F5F8FC] border border-[#DCE5F0] text-center min-w-[130px]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  SYSTEM ROLE
                </span>
                <span className="text-sm font-bold font-sans text-[#071A35] mt-1 block">
                  {viewUser.admin_role || 'Super Admin'}
                </span>
              </div>

              <div className="px-5 py-3 rounded-xl bg-[#F5F8FC] border border-[#DCE5F0] text-center min-w-[130px]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  SECURITY PROTOCOL
                </span>
                <span className="text-sm font-bold font-sans text-emerald-600 mt-1 block flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  2FA Hardware
                </span>
              </div>
            </div>

          </div>

          {/* Navigation Tabs (Overview & Credentials, Permissions Matrix, Audit Log) */}
          <div className="flex items-center gap-6 mt-6 border-t border-[#DCE5F0] pt-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setProfileTab('overview')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                profileTab === 'overview'
                  ? 'border-[#071A35] text-[#071A35] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview &amp; Credentials
            </button>

            <button
              type="button"
              onClick={() => setProfileTab('permissions')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                profileTab === 'permissions'
                  ? 'border-[#071A35] text-[#071A35] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Permissions &amp; Scope Matrix
            </button>

            <button
              type="button"
              onClick={() => setProfileTab('audit')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                profileTab === 'audit'
                  ? 'border-[#071A35] text-[#071A35] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Audit &amp; Security Activity Log
            </button>
          </div>
        </div>

        {/* Tab 1: Overview & Credentials */}
        {profileTab === 'overview' && (
          <div className="space-y-6">
            {/* 3 Metric Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Security Clearance</span>
                  <span className="text-lg font-bold font-sans text-purple-700 mt-1 block">
                    Level 3 Vault Keyholder
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Dual-custody authorization for physical vault &amp; digital escrow</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Administrative Department</span>
                  <span className="text-lg font-bold font-sans text-slate-900 mt-1 block">
                    {viewUser.admin_role === 'Order Manager' ? 'Treasury & Wire Settlements' : viewUser.admin_role === 'Inventory Manager' ? 'Numismatic Catalog & Logistics' : 'Executive Vault Governance'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Direct authority under Highlander Board of Directors</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#F5F8FC] border border-[#DCE5F0] flex items-center justify-center text-[#071A35]">
                  <Briefcase className="w-6 h-6 text-[#C9A23A]" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Governance Standing</span>
                  <span className="text-lg font-bold font-sans text-emerald-600 mt-1 block">
                    Active &amp; Compliance Verified
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Continuous audit logging &amp; hardware key enforcement</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Two Lower Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Official Administrative Credentials */}
              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#DCE5F0] pb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                    Official Administrative Credentials
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleEdit(viewUser)}
                    className="text-xs text-[#071A35] hover:text-[#C9A23A] font-semibold transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Full Name</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{viewUser.full_name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Work Email Address</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{viewUser.email}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Direct Extension / Secure Phone</span>
                    <span className="font-mono text-slate-800 mt-0.5 block">{viewUser.phone || '(406) 883-2210'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Administrative Role</span>
                    <span className="font-semibold text-purple-700 mt-0.5 block">{viewUser.admin_role || 'Super Admin'}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-medium">Official Staff Title</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {viewUser.title || (viewUser.admin_role === 'Super Admin' ? 'Senior Numismatist & Vault Director' : viewUser.admin_role === 'Inventory Manager' ? 'Certified Coin Cataloger & Appraiser' : 'Settlement & Wire Verification Officer')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Primary Operating Facility</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{viewUser.location || 'Bigfork Storefront & Vault, MT'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">System Authorization Key</span>
                    <span className="font-mono text-slate-700 mt-0.5 block">HGS-AUTH-{viewUser.customer_id?.replace(/[^0-9]/g, '') || '001'}-SEC</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-medium">Account Commissioning Date</span>
                    <span className="font-mono text-slate-600 mt-0.5 block">
                      {new Date(viewUser.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="sm:col-span-2 p-3 bg-purple-50/60 border border-purple-200/60 rounded-xl">
                    <span className="text-[11px] font-semibold text-purple-900 block mb-0.5">Administrative Security Directives &amp; Scope:</span>
                    <p className="text-xs text-purple-800/90 leading-relaxed font-sans">
                      {viewUser.notes || 'Authorized staff keyholder with dual-custody access to precious metal inventory, bank wire approvals, customer identity verification, and live spot spread controls.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Operational Privileges & Clearance Capabilities */}
              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#DCE5F0] pb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                      Privileged System Capabilities
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Full Clearance
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 mt-1">
                    <div className="py-2.5 flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">Product Catalog &amp; Bullion Inventory</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Full Access</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Create, edit, adjust spot multipliers, archive lots, and update coin certifications.</p>
                      </div>
                    </div>

                    <div className="py-2.5 flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">Order Fulfillment &amp; Wire Approvals</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Authorized</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Verify incoming bank wire transfers, authorize vault dispatch, and release collector escrow.</p>
                      </div>
                    </div>

                    <div className="py-2.5 flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">User Directory &amp; Collector Governance</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Authorized</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Review KYC/AML collector documentation, elevate buyer tiers, and manage staff accounts.</p>
                      </div>
                    </div>

                    <div className="py-2.5 flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">Spot Price Feed &amp; Hedging Controls</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Authorized</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Manage live Gold/Silver spot margins, premium overrides, and API data feed connectivity.</p>
                      </div>
                    </div>

                    <div className="py-2.5 flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">Security Audit &amp; Ledger Reporting</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Authorized</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Inspect immutable system audit trails and export certified precious metals transaction ledgers.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Highlander Cryptographic Governance Protocol</span>
                  <span className="font-mono text-purple-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Hardware Token Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: System Permissions Matrix */}
        {profileTab === 'permissions' && (
          <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                  Administrative Permissions Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configured system access privileges and security clearance levels for {viewUser.full_name}.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-mono font-semibold">
                Policy: Full Governance
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F5F8FC] uppercase font-semibold text-slate-600 border-b border-[#DCE5F0]">
                  <tr>
                    <th className="px-4 py-3">System Module</th>
                    <th className="px-4 py-3">Access Level</th>
                    <th className="px-4 py-3">Operational Scope</th>
                    <th className="px-4 py-3">Clearance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5F0]">
                  {[
                    { module: 'Product Catalog & Bullion', level: 'Full Access (Read / Write / Delete)', scope: 'All precious metal products, numismatics & inventory lots', clearance: 'Level 3 Vault', status: 'Enforced' },
                    { module: 'Orders & Wire Settlements', level: 'Verification & Release Authority', scope: 'Bank wire confirmation, settlement matching, order state overrides', clearance: 'Level 3 Vault', status: 'Enforced' },
                    { module: 'Collector Directory', level: 'User & KYC Administration', scope: 'Collector profiles, tiered discounts, buyer verification, account suspension', clearance: 'Level 3 Vault', status: 'Enforced' },
                    { module: 'Spot Price Margins Engine', level: 'Spread & Hedging Control', scope: 'Real-time live spot margin multipliers and custom markup formulas', clearance: 'Level 3 Vault', status: 'Enforced' },
                    { module: 'Payment Transactions & Ledgers', level: 'Audit & Financial Clearance', scope: 'Reconciliation ledgers, payment tracking, transaction receipt generation', clearance: 'Level 3 Vault', status: 'Enforced' },
                    { module: 'Security & Audit Logging', level: 'Immutable Log Inspection', scope: 'Full historical audit trail review, staff session inspection, compliance exports', clearance: 'Level 3 Vault', status: 'Enforced' },
                  ].map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F5F8FC]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 font-sans">
                        {item.module}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#071A35]">
                        {item.level}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.scope}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-purple-700">
                        {item.clearance}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-mono text-emerald-600 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Audit Activity Log */}
        {profileTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                  Staff Security &amp; Activity Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable cryptographic activity trail registered for {viewUser.full_name}.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Last Synced: Just now
              </span>
            </div>

            <div className="space-y-3">
              {[
                { action: 'Spot Price Margin Calibrated', detail: 'Adjusted spot multiplier to +2.80% for 1 oz American Gold Eagle lots.', time: '12m ago', type: 'price', ip: '192.168.1.10 (Bigfork Vault)' },
                { action: 'Bank Wire Settlement Verified', detail: 'Confirmed wire receipt for Order #HGS-2026-1003 (Thomas MacGregor — $442.75).', time: '2h ago', type: 'order', ip: '192.168.1.10 (Bigfork Vault)' },
                { action: 'Catalog Item Added', detail: 'Published new specimen: 1876 George T. Morgan Proposed $100 Gold Union™ (HGS-GOLD-001).', time: 'Yesterday', type: 'catalog', ip: '192.168.1.12 (Numismatics Station)' },
                { action: 'Collector Account Verified', detail: 'Reviewed KYC credentials and assigned VIP Vault tier to William Sterling.', time: 'Oct 26, 2026', type: 'user', ip: '192.168.1.10 (Bigfork Vault)' },
                { action: '2FA Hardware Session Authenticated', detail: 'Successful hardware token login from Highlander Vault Master Terminal.', time: 'Oct 25, 2026', type: 'security', ip: '192.168.1.10 (Bigfork Vault)' },
                { action: 'Quarterly Compliance Ledger Exported', detail: 'Generated encrypted bullion sales report for regulatory compliance.', time: 'Oct 20, 2026', type: 'export', ip: '192.168.1.10 (Bigfork Vault)' },
              ].map((evt, idx) => (
                <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#DCE5F0] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm font-sans">{evt.action}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                        {evt.type.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{evt.time}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-sans">{evt.detail}</p>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Terminal: {evt.ip}</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Integrity Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // RENDER: CUSTOMER / COLLECTOR PROFILE
  // ==========================================
  const renderCustomerProfile = () => {
    const totalSpentComputed = userOrders.length > 0 
      ? userOrders.reduce((sum, o) => sum + Number(o.total_settlement || o.total_amount || 0), 0)
      : Number(viewUser.total_spent || 0);

    const ordersCount = userOrders.length || viewUser.orders_count || 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Navigation & Action Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewUser(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F0] hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Users</span>
            </button>
            <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <span>Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span>Users</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-800 font-semibold">Collector Profile</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchUsers();
                toast.success('Profile synced with latest records');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F0] hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                viewUser.account_status === 'Active'
                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {viewUser.account_status === 'Active' ? (
                <>
                  <Ban className="w-3.5 h-3.5 text-amber-600" />
                  <span>Deactivate Account</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Activate Account</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleEdit(viewUser)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071A35] hover:bg-[#0B2548] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#C9A23A]" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-[#DCE5F0] p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: Avatar & Identity Details */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#071A35] border-2 border-[#C9A23A] text-[#C9A23A] text-xl font-bold flex items-center justify-center shadow-sm shrink-0 font-sans">
                {viewUser.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'CU'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold font-sans text-slate-900">
                    {viewUser.full_name}
                  </h1>
                  <StatusBadge status={viewUser.account_status || 'Active'} />
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                    Role: Collector ({viewUser.tier || 'Collector'})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-semibold text-slate-700">ID:</span>
                    <span>{viewUser.customer_id}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(viewUser.customer_id);
                        toast.success('ID copied');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Copy User ID"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{viewUser.email}</span>
                  </div>

                  {viewUser.phone && (
                    <div className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{viewUser.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Top 3 Stat Tiles for Customer */}
            <div className="flex items-center gap-3">
              <div className="px-5 py-3 rounded-xl bg-[#F5F8FC] border border-[#DCE5F0] text-center min-w-[120px]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  TOTAL SPENT
                </span>
                <span className="text-lg font-bold font-mono text-emerald-600 mt-0.5 block">
                  ${Number(totalSpentComputed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="px-5 py-3 rounded-xl bg-[#F5F8FC] border border-[#DCE5F0] text-center min-w-[90px]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  ORDERS
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                  {ordersCount}
                </span>
              </div>

              <div className="px-5 py-3 rounded-xl bg-[#F5F8FC] border border-[#DCE5F0] text-center min-w-[90px]">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  INQUIRIES
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                  {userInquiries.length}
                </span>
              </div>
            </div>

          </div>

          {/* Navigation Tabs (Overview, Orders, Payments, Inquiries) */}
          <div className="flex items-center gap-6 mt-6 border-t border-[#DCE5F0] pt-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setProfileTab('overview')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                profileTab === 'overview'
                  ? 'border-[#071A35] text-[#071A35] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() => setProfileTab('orders')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                profileTab === 'orders'
                  ? 'border-[#071A35] text-[#071A35] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Orders ({userOrders.length})
            </button>

            <button
              type="button"
              onClick={() => setProfileTab('payments')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                profileTab === 'payments'
                  ? 'border-[#071A35] text-[#071A35] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Payments ({userPayments.length})
            </button>

            <button
              type="button"
              onClick={() => setProfileTab('inquiries')}
              className={`pb-2.5 transition-colors cursor-pointer border-b-2 ${
                profileTab === 'inquiries'
                  ? 'border-[#071A35] text-[#071A35] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Inquiries ({userInquiries.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {profileTab === 'overview' && (
          <div className="space-y-6">
            {/* 3 KPI Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Lifetime Spend</span>
                  <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
                    ${Number(totalSpentComputed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Settled across acquisitions &amp; orders</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Total Orders</span>
                  <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                    {ordersCount}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Fulfilled shipments &amp; vault allocations</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#F5F8FC] border border-[#DCE5F0] flex items-center justify-center text-[#071A35]">
                  <ShoppingBag className="w-6 h-6 text-[#C9A23A]" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Acquisition Inquiries</span>
                  <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                    {userInquiries.length}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Precious metals advisory requests</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#F5F8FC] border border-[#DCE5F0] flex items-center justify-center text-[#071A35]">
                  <MessageSquare className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </div>

            {/* Two Lower Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Confidential Collector Details */}
              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#DCE5F0] pb-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                    Confidential Collector Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleEdit(viewUser)}
                    className="text-xs text-[#071A35] hover:text-[#C9A23A] font-semibold transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Email Address</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{viewUser.email}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Phone</span>
                    <span className="font-mono text-slate-800 mt-0.5 block">{viewUser.phone || 'Not provided'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Location</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{viewUser.city || 'Bigfork'}, {viewUser.state || 'MT'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Assigned Tier</span>
                    <span className="font-semibold text-[#071A35] mt-0.5 block">
                      {viewUser.tier || 'Collector'}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-medium">Vault Delivery / Depository Address</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{viewUser.address}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-medium">Registration Date</span>
                    <span className="font-mono text-slate-600 mt-0.5 block">
                      {new Date(viewUser.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="sm:col-span-2 p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl">
                    <span className="text-[11px] font-semibold text-amber-900 block mb-0.5">Collector Notes &amp; Instructions:</span>
                    <p className="text-xs text-amber-800/90 leading-relaxed font-sans">
                      {viewUser.notes}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Recent Orders & Settlements */}
              <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#DCE5F0] pb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                      Recent Activity &amp; Orders
                    </h3>
                    <button
                      type="button"
                      onClick={() => setProfileTab('orders')}
                      className="text-xs text-[#071A35] hover:text-[#C9A23A] font-semibold transition-colors cursor-pointer"
                    >
                      View all ({userOrders.length})
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 mt-2">
                    {userOrders.length > 0 ? (
                      userOrders.slice(0, 4).map(o => (
                        <div key={o.id || o.order_id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">
                                #{o.order_number || o.order_id}
                              </span>
                              <StatusBadge status={o.fulfillment_status || o.order_status || 'Processing'} />
                            </div>
                            <span className="text-slate-500 text-[11px] block mt-0.5 truncate max-w-xs">
                              {o.items?.[0]?.title || 'Rare Numismatic Acquisition'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 block">
                              ${Number(o.total_settlement || o.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(o.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p>No recent orders on file for this user.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Account security: Verified</span>
                  <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Good Standing
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Orders */}
        {profileTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans mb-4">
              All Orders Placed by {viewUser.full_name}
            </h3>

            {userOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F8FC] uppercase font-semibold text-slate-600 border-b border-[#DCE5F0]">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Purchased Items</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Payment Status</th>
                      <th className="px-4 py-3">Order Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5F0]">
                    {userOrders.map(o => (
                      <tr key={o.id || o.order_id} className="hover:bg-[#F5F8FC]/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          #{o.order_number || o.order_id}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-xs">
                          {o.items?.[0]?.title || 'Highlander Coin Specimen'}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                          ${Number(o.total_settlement || o.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={o.payment_status} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={o.fulfillment_status || o.order_status || 'Processing'} />
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {new Date(o.created_at).toISOString().split('T')[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No orders registered under this user account yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payments */}
        {profileTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans mb-4">
              Payment &amp; Settlement Transactions
            </h3>

            {userPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F8FC] uppercase font-semibold text-slate-600 border-b border-[#DCE5F0]">
                    <tr>
                      <th className="px-4 py-3">Transaction ID</th>
                      <th className="px-4 py-3">Order Ref</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Payment Method</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5F0]">
                    {userPayments.map(p => (
                      <tr key={p.id || p.transaction_id} className="hover:bg-[#F5F8FC]/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {p.transaction_id}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {p.order_id}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          ${Number(p.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {p.payment_method}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.payment_status} />
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {new Date(p.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No payment settlement receipts found for this user.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Inquiries */}
        {profileTab === 'inquiries' && (
          <div className="bg-white rounded-2xl border border-[#DCE5F0] p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans mb-4">
              Acquisition Inquiries &amp; Consultation Requests
            </h3>

            {userInquiries.length > 0 ? (
              <div className="space-y-3">
                {userInquiries.map(inq => (
                  <div key={inq.id} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#DCE5F0] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{inq.lot_title || inq.subject || 'Acquisition Request'}</span>
                      <StatusBadge status={inq.status || 'New'} />
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {inq.message || inq.notes || 'Inquiry details registered via Highlander customer showcase.'}
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Submitted: {new Date(inq.created_at).toLocaleString()}</span>
                      <span>Type: {inq.inquiry_type || 'Private Buyback / Acquisition'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No inquiries or consultation requests submitted by this user.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // MAIN RETURN (VIEW USER PROFILE OR DIRECTORY TABLE + MODALS)
  // ==========================================
  return (
    <>
      {viewUser ? (
        viewUser.is_admin || viewUser.role === 'Admin' ? (
          renderAdminProfile()
        ) : (
          renderCustomerProfile()
        )
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900">
                Users &amp; Collectors
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage storefront registered collectors, buyer profiles, and administrative staff roles.
              </p>
            </div>

            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071A35] hover:bg-[#0B2548] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-[#C9A23A]" />
              Add User
            </button>
          </div>

          {/* Role Filter Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setRoleFilter('All');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === 'All'
                  ? 'bg-[#071A35] text-white shadow-2xs'
                  : 'bg-white border border-[#DCE5F0] text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              All Users <span className="ml-1 opacity-70">({roleCounts.all})</span>
            </button>

            <button
              onClick={() => {
                setRoleFilter('Customer');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === 'Customer'
                  ? 'bg-[#071A35] text-white shadow-2xs'
                  : 'bg-white border border-[#DCE5F0] text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Customers <span className="ml-1 opacity-70">({roleCounts.customers})</span>
            </button>

            <button
              onClick={() => {
                setRoleFilter('Admin');
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === 'Admin'
                  ? 'bg-[#071A35] text-white shadow-2xs'
                  : 'bg-white border border-[#DCE5F0] text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Admins <span className="ml-1 opacity-70">({roleCounts.admins})</span>
            </button>
          </div>

          {/* Dynamic Data Table with onRowClick opening full Profile */}
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
            onRowClick={(row) => setViewUser(row)}
            onView={(row) => setViewUser(row)}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
            viewLabel="View Profile"
            editLabel="Edit User"
            deleteLabel="Delete User"
            emptyTitle="No users found"
            emptyDescription="No users match your active search or role criteria."
            filterComponent={
              <div className="flex items-center gap-2">
                <Select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: 'All', label: 'All Roles' },
                    { value: 'Customer', label: 'Customers Only' },
                    { value: 'Admin', label: 'Admins Only' }
                  ]}
                />

                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: 'All', label: 'All Statuses' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Suspended', label: 'Suspended' },
                    { value: 'Pending Verification', label: 'Pending Verification' }
                  ]}
                />
              </div>
            }
          />
        </div>
      )}

      {/* Slide-Over Right Drawer User Form Modal (Always mounted so Edit Profile inside Profile View works seamlessly!) */}
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

      {/* Confirm Delete Dialog (Always mounted so Delete inside Profile or Table works seamlessly) */}
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
    </>
  );
};
