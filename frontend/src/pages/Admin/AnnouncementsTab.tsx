import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react';
import { useAdminAnnouncements, type Announcement } from '../../hooks/useAdminData';
import styles from './Admin.module.css';

interface Props {
  adminAddress: string;
}

const TYPE_OPTIONS: Announcement['type'][] = ['info', 'warning', 'success', 'critical'];

export default function AnnouncementsTab({ adminAddress }: Props) {
  const { announcements, addAnnouncement, removeAnnouncement, toggleActive } = useAdminAnnouncements();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' as Announcement['type'] });
  const [saved, setSaved] = useState(false);

  const handleAdd = () => {
    if (!form.title.trim() || !form.message.trim()) return;
    addAnnouncement({ title: form.title, message: form.message, type: form.type, active: true, createdBy: adminAddress });
    setForm({ title: '', message: '', type: 'info' });
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}><Megaphone size={22} /> Announcements</h2>
        <p className={styles.pageSubtitle}>Manage banners and alerts shown to all users ({announcements.length} total)</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={styles.submitBtn} onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Announcement
        </button>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#26d07c', fontSize: 13, fontWeight: 600 }}>
            <CheckCircle size={16} /> Created
          </span>
        )}
      </div>

      {showForm && (
        <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20, maxWidth: 600 }}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Title</label>
              <input className={styles.formInput} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Type</label>
              <select className={styles.formSelect} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Announcement['type'] })}>
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Message</label>
              <textarea className={styles.formTextarea} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Announcement message..." rows={3} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className={styles.submitBtn} onClick={handleAdd}>Create</button>
            <button className={`${styles.actionBtn} ${styles.neutral}`} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {announcements.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No announcements yet. Create one to display a banner to all users.
        </div>
      ) : (
        <div>
          {announcements.map((ann) => (
            <div key={ann.id} className={styles.announcementCard} data-type={ann.type}>
              <div className={styles.announcementContent}>
                <div className={styles.announcementTitle}>
                  {ann.title}
                  <span className={`${styles.badge} ${ann.active ? styles.active : styles.inactive}`} style={{ marginLeft: 8 }}>
                    {ann.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={styles.announcementMessage}>{ann.message}</div>
                <div className={styles.announcementMeta}>
                  Type: {ann.type} · Created: {new Date(ann.createdAt).toLocaleDateString()} · By: {ann.createdBy.slice(0, 8)}...
                </div>
              </div>
              <div className={styles.announcementActions}>
                <button className={`${styles.actionBtn} ${styles.neutral}`} onClick={() => toggleActive(ann.id)} title={ann.active ? 'Deactivate' : 'Activate'}>
                  {ann.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button className={`${styles.actionBtn} ${styles.reject}`} onClick={() => removeAnnouncement(ann.id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
