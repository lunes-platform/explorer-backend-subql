import React from 'react';
import { X, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  setSlippage: (v: number) => void;
  deadline: number;
  setDeadline: (v: number) => void;
}

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 3.0];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, slippage, setSlippage, deadline, setDeadline }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: 380, maxWidth: '90vw',
        background: 'var(--bg-surface, #1a1a1a)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} /> Swap Settings
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Slippage */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            Slippage Tolerance
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {SLIPPAGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSlippage(opt)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: `1px solid ${slippage === opt ? 'var(--color-brand-400, #6C38FF)' : 'rgba(255,255,255,0.1)'}`,
                  background: slippage === opt ? 'rgba(108,56,255,0.15)' : 'rgba(255,255,255,0.04)',
                  color: slippage === opt ? 'var(--color-brand-400, #6C38FF)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {opt}%
              </button>
            ))}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', padding: '0 10px',
            }}>
              <input
                type="number" value={slippage} onChange={(e) => setSlippage(Number(e.target.value))}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 13, width: '100%', textAlign: 'center' }}
                min={0.01} max={50} step={0.1}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>%</span>
            </div>
          </div>
          {slippage > 5 && (
            <p style={{ fontSize: 11, color: '#fe9f00', marginTop: 6 }}>High slippage may result in unfavorable trades</p>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
            Transaction Deadline
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
          }}>
            <input
              type="number" value={deadline} onChange={(e) => setDeadline(Number(e.target.value))}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 14, width: 60, textAlign: 'center' }}
              min={1} max={120}
            />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>minutes</span>
          </div>
        </div>

        <button onClick={onClose} style={{
          padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(90deg, #6C38FF, #5228DB)', color: 'white',
          fontSize: 15, fontWeight: 600, transition: 'opacity 0.15s',
        }}>
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
