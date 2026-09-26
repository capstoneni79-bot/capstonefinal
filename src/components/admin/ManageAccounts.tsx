import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Save, X, Key, Shield, UserCheck, Search } from 'lucide-react';
import { Barangay, UserAccount, UserRole } from '../../types';
import { storageService } from '../../services/storageService';

interface ManageAccountsProps {
  users: UserAccount[];
  barangays: Barangay[];
  onRefresh: () => void;
  currentUser?: UserAccount | null;
}

export const ManageAccounts: React.FC<ManageAccountsProps> = ({ users, barangays, onRefresh, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<UserAccount | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('focal');
  const [assignedBarangay, setAssignedBarangay] = useState(barangays[0]?.name || 'Poblacion');
  const [contactNo, setContactNo] = useState('');
  const [active, setActive] = useState(true);

  const startEdit = (u: UserAccount) => {
    if (u.role === 'super_admin' && currentUser?.role !== 'super_admin') {
      alert('Only a Super Admin can modify a Super Admin account.');
      return;
    }
    setIsEditing(u);
    setIsAddingNew(false);
    setName(u.name);
    setUsername(u.username);
    setEmail(u.email);
    setPassword(u.password || '••••••••');
    setRole(u.role);
    setAssignedBarangay(u.assignedBarangay || barangays[0]?.name || 'Poblacion');
    setContactNo(u.contactNo || '');
    setActive(u.active);
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setIsEditing(null);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('hinunangan2025');
    setRole('focal');
    setAssignedBarangay(barangays[0]?.name || 'Poblacion');
    setContactNo('');
    setActive(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      alert('Please fill out full name, username, and email.');
      return;
    }

    if (isAddingNew) {
      const newAcc: UserAccount = {
        id: 'usr-' + Date.now(),
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        assignedBarangay: role === 'focal' ? assignedBarangay : undefined,
        contactNo: contactNo.trim(),
        phone: contactNo.trim(),
        active,
        createdAt: new Date().toISOString(),
      };
      storageService.saveUserAccount(newAcc);
    } else if (isEditing) {
      const updatedAcc: UserAccount = {
        ...isEditing,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: password.trim() !== '••••••••' ? password.trim() : isEditing.password,
        role,
        assignedBarangay: role === 'focal' ? assignedBarangay : undefined,
        contactNo: contactNo.trim(),
        active,
      };
      storageService.saveUserAccount(updatedAcc);
    }

    setIsEditing(null);
    setIsAddingNew(false);
    onRefresh();
  };

  const handleDelete = (id: string, accName: string) => {
    const targetUser = users.find(u => u.id === id);
    if (targetUser?.role === 'super_admin' && currentUser?.role !== 'super_admin') {
      alert('Only a Super Admin can delete or modify a Super Admin account.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove account "${accName}"?`)) {
      storageService.deleteUserAccount(id);
      onRefresh();
    }
  };

  const q = searchTerm.toLowerCase();
  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(q) ||
    (u.username || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q) ||
    (Boolean(u.assignedBarangay) && (u.assignedBarangay || '').toLowerCase().includes(q))
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold text-stone-900">Manage System Accounts & Access</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Create and manage accounts for Agricultural Extension Focal Persons, Meat Agents/Traders, and System Administrators.
          </p>
        </div>

        <button
          onClick={startAddNew}
          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add User Account
        </button>
      </div>

      {/* Editor / Create Form */}
      {(isAddingNew || isEditing) && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border-2 border-emerald-600/40 shadow-md space-y-4 text-xs animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <h3 className="font-bold text-sm text-stone-900">
              {isAddingNew ? 'Create New User / Focal / Agent Account' : `Edit Account: ${isEditing?.name}`}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setIsEditing(null);
              }}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Roland C. Mercado"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Username / Login ID *</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. focal.poblacion"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. roland@hinunangan.gov.ph"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Password</label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Initial password"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Role / Permission</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-bold"
              >
                <option value="focal">🌾 Focal Person (Barangay Level Access)</option>
                <option value="agent">🥩 Agent / Meat Trader (View Ready to Sell Only)</option>
                <option value="admin">🏛️ Administrator (Standard Admin Access)</option>
                {currentUser?.role === 'super_admin' && (
                  <option value="super_admin">👑 Super Administrator (Master System Access)</option>
                )}
              </select>
            </div>

            {role === 'focal' && (
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Designated Barangay
                </label>
                <select
                  value={assignedBarangay}
                  onChange={e => setAssignedBarangay(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-medium"
                >
                  {barangays.map(b => (
                    <option key={b.id} value={b.name}>
                      Brgy. {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={contactNo}
                onChange={e => setContactNo(e.target.value)}
                placeholder="0917-000-0000"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300"
                />
                <span>Account is Active & Allowed to Sign In</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setIsEditing(null);
              }}
              className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 font-semibold text-stone-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Account
            </button>
          </div>
        </form>
      )}

      {/* User Accounts Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search user name, email, or role..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Total Accounts: <strong>{filtered.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/80 text-stone-700 font-semibold border-b border-stone-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Jurisdiction</th>
                <th className="py-3 px-4">Login Email / Username</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-stone-900">{u.name}</div>
                    <div className="text-[10px] text-stone-400">{u.contactNo || 'No contact'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'focal'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {u.role === 'admin'
                        ? 'ADMINISTRATOR'
                        : u.role === 'focal'
                        ? 'FOCAL PERSON'
                        : 'AGENT / TRADER'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-800">
                    {u.role === 'focal' ? `Brgy. ${u.assignedBarangay}` : 'Municipal-Wide'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-stone-800">{u.username}</div>
                    <div className="text-[11px] text-stone-500">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {u.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(u)}
                        className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-200 transition cursor-pointer"
                        title="Edit Account"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
