'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import { useStore } from '../../lib/store';
import {
  Users,
  Search,
  Check,
  X,
  UserCheck,
  UserX,
  ShieldCheck,
  Save,
  Loader2,
  AlertCircle,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';

interface PermissionItem {
  module: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: string; // JSON string
  approvalStatus: string;
  createdAt: string;
}

export default function UsersPage() {
  const { user: currentUser } = useStore();
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterApproval, setFilterApproval] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  
  // Local permissions editing states
  const [editStates, setEditStates] = useState<Record<string, {
    role: string;
    isActive: boolean;
    permissions: PermissionItem[];
    dirty: boolean;
  }>>({});

  const modules = ['Products', 'Sales', 'Purchase', 'Manufacturing', 'Inventory', 'Audit Logs'];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/users');
      setUsersList(data);
      
      // Initialize edit states
      const states: typeof editStates = {};
      data.forEach((u: UserProfile) => {
        let parsedPerms: PermissionItem[] = [];
        try {
          parsedPerms = JSON.parse(u.permissions || '[]');
        } catch (e) {
          parsedPerms = [];
        }

        // Fill missing modules with false defaults
        const filledPerms = modules.map(modName => {
          const existing = parsedPerms.find(p => p.module === modName);
          return {
            module: modName,
            create: existing?.create ?? false,
            read: existing?.read ?? false,
            update: existing?.update ?? false,
            delete: existing?.delete ?? false
          };
        });

        states[u.id] = {
          role: u.role,
          isActive: u.isActive,
          permissions: filledPerms,
          dirty: false
        };
      });
      setEditStates(states);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER') {
      fetchUsers();
    } else {
      setLoading(false);
      setError('Access Denied: Only Administrators and Owners have access to the User Directory.');
    }
  }, [currentUser]);

  const handleCheckboxToggle = (userId: string, moduleName: string, action: 'create' | 'read' | 'update' | 'delete') => {
    setEditStates(prev => {
      const userState = prev[userId];
      if (!userState) return prev;

      const updatedPerms = userState.permissions.map(p => {
        if (p.module === moduleName) {
          return { ...p, [action]: !p[action] };
        }
        return p;
      });

      return {
        ...prev,
        [userId]: {
          ...userState,
          permissions: updatedPerms,
          dirty: true
        }
      };
    });
  };

  const handleLocalRoleChange = (userId: string, newRole: string) => {
    setEditStates(prev => {
      const userState = prev[userId];
      if (!userState) return prev;
      return {
        ...prev,
        [userId]: {
          ...userState,
          role: newRole,
          dirty: true
        }
      };
    });
  };

  const handleLocalStatusToggle = (userId: string) => {
    setEditStates(prev => {
      const userState = prev[userId];
      if (!userState) return prev;
      return {
        ...prev,
        [userId]: {
          ...userState,
          isActive: !userState.isActive,
          dirty: true
        }
      };
    });
  };

  const handleApprove = async (userId: string) => {
    try {
      setUpdatingId(userId);
      const res = await api.post(`/users/${userId}/approve`, {});
      
      // Update local state
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, approvalStatus: 'APPROVED' } : u));
      
      alert('User account approved successfully!');
    } catch (err: any) {
      alert(`Failed to approve user: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setUpdatingId(userId);
      const res = await api.post(`/users/${userId}/reject`, {});
      
      // Update local state
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, approvalStatus: 'REJECTED' } : u));
      
      alert('User account rejected successfully!');
    } catch (err: any) {
      alert(`Failed to reject user: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveRow = async (userId: string) => {
    const state = editStates[userId];
    if (!state) return;

    try {
      setUpdatingId(userId);
      await api.put(`/users/${userId}`, {
        role: state.role,
        isActive: state.isActive,
        permissions: JSON.stringify(state.permissions)
      });

      // Mark clean
      setEditStates(prev => ({
        ...prev,
        [userId]: { ...prev[userId], dirty: false }
      }));

      // Update source user lists
      setUsersList(prev => prev.map(u => u.id === userId ? {
        ...u,
        role: state.role,
        isActive: state.isActive,
        permissions: JSON.stringify(state.permissions)
      } : u));

      alert('User permission parameters saved successfully!');
    } catch (err: any) {
      alert(`Failed to save permission matrix: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = usersList.filter(
    (u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase());
      
      const matchesApproval =
        filterApproval === 'ALL' || u.approvalStatus === filterApproval;

      return matchesSearch && matchesApproval;
    }
  );

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span>Synchronizing user permissions directory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-rose-500/20 text-center max-w-xl mx-auto mt-12">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-200">Security Access Verification</h3>
        <p className="text-xs text-slate-400 mt-2 font-mono">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          User Permissions Matrix
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Map granular Create, Read, Update, and Delete permissions across modules. Click save on rows that are modified.
        </p>
      </div>

      {/* Operations Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search commanders by Name, Email, or Role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-xs"
            />
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            title="Refresh Directory"
            className="p-3 bg-[#0d1426] border border-slate-800/80 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Approval Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-[#090e1a] border border-slate-800/60 rounded-xl">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterApproval(status)}
              className={`px-3 py-1.5 rounded-lg text-xxs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filterApproval === status
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-md shadow-sky-500/5'
                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Top layer header with module groups */}
              <tr className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-850">
                <th className="p-4 font-bold border-r border-slate-850" rowSpan={2}>Commander Details</th>
                <th className="p-4 font-bold border-r border-slate-850 text-center" rowSpan={2}>Role</th>
                {modules.map(modName => (
                  <th key={modName} className="p-2 font-bold border-r border-slate-850 text-center text-sky-400" colSpan={4}>
                    {modName}
                  </th>
                ))}
                <th className="p-4 font-bold border-r border-slate-850 text-center" rowSpan={2}>Approval</th>
                <th className="p-4 font-bold border-r border-slate-850 text-center" rowSpan={2}>Status</th>
                <th className="p-4 font-bold text-center" rowSpan={2}>Matrix Save</th>
              </tr>
              {/* Second layer header showing CRUD letters */}
              <tr className="bg-slate-900/60 text-slate-500 uppercase tracking-widest font-mono text-[9px] border-b border-slate-850">
                {modules.map(modName => (
                  <React.Fragment key={`${modName}-sub`}>
                    <th className="p-1.5 text-center font-bold">C</th>
                    <th className="p-1.5 text-center font-bold">R</th>
                    <th className="p-1.5 text-center font-bold">U</th>
                    <th className="p-1.5 text-center font-bold border-r border-slate-850">D</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredUsers.map((u) => {
                const isMe = u.id === currentUser?.id;
                const state = editStates[u.id];
                if (!state) return null;

                const isNew = u.createdAt ? (new Date().getTime() - new Date(u.createdAt).getTime() < 24 * 60 * 60 * 1000) : false;

                return (
                  <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                    {/* User Metadata */}
                    <td className="p-4 border-r border-slate-850">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0c1326] flex items-center justify-center font-bold text-sky-400 border border-slate-700/50 text-xxs">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200 truncate">{u.name}</span>
                            {isNew && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[8px] font-extrabold uppercase font-mono tracking-wide">
                                NEW
                              </span>
                            )}
                          </div>
                          <span className="text-xxs text-slate-500 font-mono truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role Select */}
                    <td className="p-3 text-center border-r border-slate-850">
                      <select
                        disabled={isMe || updatingId === u.id}
                        value={state.role}
                        onChange={(e) => handleLocalRoleChange(u.id, e.target.value)}
                        className="glass-input px-2 py-1 rounded text-[10px] bg-slate-950 font-bold font-mono tracking-wide"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="SALES">SALES</option>
                        <option value="PURCHASE">PURCHASE</option>
                        <option value="MANUFACTURING">MFG</option>
                        <option value="INVENTORY">INVENTORY</option>
                        <option value="OWNER">OWNER</option>
                        <option value="CUSTOMER">CUSTOMER</option>
                      </select>
                    </td>

                    {/* CRUD Toggles for each module */}
                    {modules.map(modName => {
                      const modPerm = state.permissions.find(p => p.module === modName) || {
                        module: modName, create: false, read: false, update: false, delete: false
                      };

                      return (
                        <React.Fragment key={`${u.id}-${modName}-matrix`}>
                          {/* Create */}
                          <td className="p-1 text-center">
                            <input
                              type="checkbox"
                              disabled={isMe || updatingId === u.id}
                              checked={modPerm.create}
                              onChange={() => handleCheckboxToggle(u.id, modName, 'create')}
                              className="w-3.5 h-3.5 rounded border-slate-800 accent-sky-500 cursor-pointer"
                            />
                          </td>
                          {/* Read */}
                          <td className="p-1 text-center">
                            <input
                              type="checkbox"
                              disabled={isMe || updatingId === u.id}
                              checked={modPerm.read}
                              onChange={() => handleCheckboxToggle(u.id, modName, 'read')}
                              className="w-3.5 h-3.5 rounded border-slate-800 accent-sky-500 cursor-pointer"
                            />
                          </td>
                          {/* Update */}
                          <td className="p-1 text-center">
                            <input
                              type="checkbox"
                              disabled={isMe || updatingId === u.id}
                              checked={modPerm.update}
                              onChange={() => handleCheckboxToggle(u.id, modName, 'update')}
                              className="w-3.5 h-3.5 rounded border-slate-800 accent-sky-500 cursor-pointer"
                            />
                          </td>
                          {/* Delete */}
                          <td className="p-1 text-center border-r border-slate-850">
                            <input
                              type="checkbox"
                              disabled={isMe || updatingId === u.id}
                              checked={modPerm.delete}
                              onChange={() => handleCheckboxToggle(u.id, modName, 'delete')}
                              className="w-3.5 h-3.5 rounded border-slate-800 accent-sky-500 cursor-pointer"
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {/* Approval Action/Badge */}
                    <td className="p-3 text-center border-r border-slate-850 min-w-[130px]">
                      {u.approvalStatus === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={updatingId === u.id || isMe}
                            onClick={() => handleApprove(u.id)}
                            title="Approve Commander"
                            className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === u.id || isMe}
                            onClick={() => handleReject(u.id)}
                            title="Reject Commander"
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider border ${
                            u.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                          }`}>
                            {u.approvalStatus}
                          </span>
                          {u.approvalStatus === 'REJECTED' && !isMe && (
                            <button
                              type="button"
                              disabled={updatingId === u.id}
                              onClick={() => handleApprove(u.id)}
                              className="text-[9px] text-sky-400 hover:text-sky-300 underline font-mono mt-1 cursor-pointer"
                            >
                              Re-Approve
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="p-3 text-center border-r border-slate-850">
                      <button
                        type="button"
                        disabled={isMe || updatingId === u.id}
                        onClick={() => handleLocalStatusToggle(u.id)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border cursor-pointer ${
                          state.isActive
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                        }`}
                      >
                        {state.isActive ? 'ACTIVE' : 'DEACTIVED'}
                      </button>
                    </td>

                    {/* Save Action */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        disabled={updatingId === u.id || (!state.dirty && u.role === state.role && u.isActive === state.isActive)}
                        onClick={() => handleSaveRow(u.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xxs font-bold cursor-pointer transition-all ${
                          state.dirty
                            ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/15'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {updatingId === u.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        <span>Save</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
