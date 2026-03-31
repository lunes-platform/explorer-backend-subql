import { useState, useEffect, useCallback } from 'react';
import {
  Lock, Users, Plus, Trash2, Edit3, Save, X, Eye, EyeOff,
  Shield, ShieldCheck, ShieldAlert, UserCheck, UserX, KeyRound,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import styles from './Admin.module.css';
import { API_BASE_URL } from '../../config';

const API = API_BASE_URL;

interface TeamMember {
  id: number;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'editor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

type SettingsSection = 'password' | 'team';

export default function SettingsTab() {
  const { user, token } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('password');

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h2 className={styles.settingsTitle}>
          <Shield size={22} />
          Settings & Security
        </h2>
        <p className={styles.settingsSubtitle}>
          Manage your password and control team access to the admin panel.
        </p>
      </div>

      <div className={styles.settingsTabs}>
        <button
          className={`${styles.settingsTabBtn} ${activeSection === 'password' ? styles.active : ''}`}
          onClick={() => setActiveSection('password')}
        >
          <Lock size={16} />
          My Password
        </button>
        <button
          className={`${styles.settingsTabBtn} ${activeSection === 'team' ? styles.active : ''}`}
          onClick={() => setActiveSection('team')}
        >
          <Users size={16} />
          Team
        </button>
      </div>

      {activeSection === 'password' && <PasswordSection token={token} />}
      {activeSection === 'team' && <TeamSection token={token} currentUser={user} />}
    </div>
  );
}

// ─── Password Section ───
function PasswordSection({ token }: { token: string | null }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Server connection error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.settingsSection}>
      <div className={styles.settingsCard}>
        <div className={styles.settingsCardHeader}>
          <KeyRound size={20} />
          <div>
            <h3>Change Password</h3>
            <p>Update your admin panel access password.</p>
          </div>
        </div>

        {message && (
          <div className={`${styles.settingsAlert} ${styles[message.type]}`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.settingsForm}>
          <div className={styles.settingsFormGroup}>
            <label>Current Password</label>
            <div className={styles.passwordInput}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
              />
              <button type="button" className={styles.togglePassword} onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className={styles.settingsFormRow}>
            <div className={styles.settingsFormGroup}>
              <label>New Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
                <button type="button" className={styles.togglePassword} onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className={styles.settingsFormGroup}>
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat the new password"
                required
                minLength={6}
              />
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div className={`${styles.settingsAlert} ${styles.error}`}>
              <AlertCircle size={16} />
              Passwords do not match.
            </div>
          )}

          <div className={styles.settingsFormActions}>
            <button
              type="submit"
              className={styles.settingsPrimaryBtn}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {loading ? <Loader2 size={16} className={styles.spinning} /> : <Save size={16} />}
              {loading ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Team Section ───
function TeamSection({ token, currentUser }: { token: string | null; currentUser: any }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'editor'>('editor');

  // Reset password state
  const [resetPassword, setResetPassword] = useState('');

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch {
      console.error('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch(`${API}/admin/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail, full_name: newName, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `${newName} added successfully!` });
        setShowAddForm(false);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewRole('editor');
        fetchMembers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add member.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error.' });
    }
  };

  const handleEdit = async (id: number) => {
    setMessage(null);
    try {
      const res = await fetch(`${API}/admin/team/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: editName, email: editEmail, role: editRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Member updated successfully!' });
        setEditingId(null);
        fetchMembers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error.' });
    }
  };

  const handleResetPassword = async (id: number) => {
    setMessage(null);
    if (resetPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    try {
      const res = await fetch(`${API}/admin/team/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: resetPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password reset successfully!' });
        setResetPasswordId(null);
        setResetPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset password.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error.' });
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    setMessage(null);
    try {
      const res = await fetch(`${API}/admin/team/${member.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !member.is_active }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `${member.full_name} ${!member.is_active ? 'activated' : 'deactivated'}.` });
        fetchMembers();
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error.' });
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.full_name}? This action cannot be undone.`)) return;
    setMessage(null);
    try {
      const res = await fetch(`${API}/admin/team/${member.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `${member.full_name} removed successfully.` });
        fetchMembers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error.' });
    }
  };

  const startEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setEditName(member.full_name);
    setEditEmail(member.email);
    setEditRole(member.role === 'owner' ? 'admin' : member.role);
    setResetPasswordId(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className={`${styles.roleBadge} ${styles.roleOwner}`}><ShieldCheck size={12} /> Owner</span>;
      case 'admin':
        return <span className={`${styles.roleBadge} ${styles.roleAdmin}`}><ShieldAlert size={12} /> Admin</span>;
      default:
        return <span className={`${styles.roleBadge} ${styles.roleEditor}`}><Edit3 size={12} /> Editor</span>;
    }
  };

  const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className={styles.settingsSection}>
        <div className={styles.settingsLoading}>
          <Loader2 size={24} className={styles.spinning} />
          <span>Loading team...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.settingsSection}>
      {message && (
        <div className={`${styles.settingsAlert} ${styles[message.type]}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className={styles.settingsCard}>
        <div className={styles.settingsCardHeader}>
          <Users size={20} />
          <div>
            <h3>Team Members</h3>
            <p>Manage who has access to the admin panel.</p>
          </div>
          {isOwnerOrAdmin && (
            <button
              className={styles.settingsPrimaryBtn}
              onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setResetPasswordId(null); }}
              style={{ marginLeft: 'auto' }}
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              {showAddForm ? 'Cancel' : 'New Member'}
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleAdd} className={styles.addMemberForm}>
            <div className={styles.settingsFormRow}>
              <div className={styles.settingsFormGroup}>
                <label>Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Smith"
                  required
                />
              </div>
              <div className={styles.settingsFormGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. john@lunes.io"
                  required
                />
              </div>
            </div>
            <div className={styles.settingsFormRow}>
              <div className={styles.settingsFormGroup}>
                <label>Initial Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className={styles.settingsFormGroup}>
                <label>Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor')}>
                  <option value="editor">Editor — Can edit content</option>
                  <option value="admin">Admin — Full access except delete</option>
                </select>
              </div>
            </div>
            <div className={styles.settingsFormActions}>
              <button type="submit" className={styles.settingsPrimaryBtn}>
                <Plus size={16} />
                Add Member
              </button>
            </div>
          </form>
        )}

        <div className={styles.teamList}>
          {members.map((member) => (
            <div key={member.id} className={`${styles.teamMemberCard} ${!member.is_active ? styles.inactive : ''}`}>
              {editingId === member.id ? (
                <div className={styles.teamMemberEdit}>
                  <div className={styles.settingsFormRow}>
                    <div className={styles.settingsFormGroup}>
                      <label>Name</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className={styles.settingsFormGroup}>
                      <label>Email</label>
                      <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    </div>
                    {member.role !== 'owner' && (
                      <div className={styles.settingsFormGroup}>
                        <label>Role</label>
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value as 'admin' | 'editor')}>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className={styles.teamMemberEditActions}>
                    <button className={styles.settingsPrimaryBtn} onClick={() => handleEdit(member.id)}>
                      <Save size={14} /> Save
                    </button>
                    <button className={styles.settingsSecondaryBtn} onClick={() => setEditingId(null)}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : resetPasswordId === member.id ? (
                <div className={styles.teamMemberEdit}>
                  <div className={styles.settingsFormRow}>
                    <div className={styles.settingsFormGroup}>
                      <label>New Password for {member.full_name}</label>
                      <input
                        type="text"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className={styles.teamMemberEditActions}>
                    <button className={styles.settingsPrimaryBtn} onClick={() => handleResetPassword(member.id)}>
                      <KeyRound size={14} /> Reset Password
                    </button>
                    <button className={styles.settingsSecondaryBtn} onClick={() => { setResetPasswordId(null); setResetPassword(''); }}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.teamMemberInfo}>
                    <div className={styles.teamMemberAvatar}>
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.teamMemberDetails}>
                      <div className={styles.teamMemberName}>
                        {member.full_name}
                        {getRoleBadge(member.role)}
                        {!member.is_active && (
                          <span className={styles.inactiveBadge}>
                            <UserX size={12} /> Inactive
                          </span>
                        )}
                      </div>
                      <div className={styles.teamMemberEmail}>{member.email}</div>
                      <div className={styles.teamMemberMeta}>
                        Joined {new Date(member.created_at).toLocaleDateString('en-US')}
                        {member.last_login && ` · Last login: ${new Date(member.last_login).toLocaleDateString('en-US')}`}
                      </div>
                    </div>
                  </div>
                  {isOwnerOrAdmin && member.role !== 'owner' && (
                    <div className={styles.teamMemberActions}>
                      <button
                        className={styles.teamActionBtn}
                        onClick={() => startEdit(member)}
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className={styles.teamActionBtn}
                        onClick={() => { setResetPasswordId(member.id); setEditingId(null); setResetPassword(''); }}
                        title="Reset Password"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        className={`${styles.teamActionBtn} ${member.is_active ? styles.deactivate : styles.activate}`}
                        onClick={() => handleToggleActive(member)}
                        title={member.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {member.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      {currentUser?.role === 'owner' && (
                        <button
                          className={`${styles.teamActionBtn} ${styles.danger}`}
                          onClick={() => handleDelete(member)}
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                  {member.id === currentUser?.id && member.role === 'owner' && (
                    <div className={styles.teamMemberActions}>
                      <span className={styles.ownerLabel}>You (Owner)</span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className={styles.rolesExplanation}>
          <h4>Roles & Permissions</h4>
          <div className={styles.rolesGrid}>
            <div className={styles.roleCard}>
              <ShieldCheck size={18} className={styles.roleIconOwner} />
              <strong>Owner</strong>
              <span>Full access. Can add, edit and remove members. Cannot be removed.</span>
            </div>
            <div className={styles.roleCard}>
              <ShieldAlert size={18} className={styles.roleIconAdmin} />
              <strong>Admin</strong>
              <span>Can manage team, edit content and access all features.</span>
            </div>
            <div className={styles.roleCard}>
              <Edit3 size={18} className={styles.roleIconEditor} />
              <strong>Editor</strong>
              <span>Can edit banners, projects, tokens and ads. No team management access.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
