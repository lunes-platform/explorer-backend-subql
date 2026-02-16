import React, { useRef, useState } from 'react';
import { Upload, X, Image, Loader2, Link as LinkIcon } from 'lucide-react';
import { API_BASE } from '../../config';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, label = 'Logo', placeholder = 'https://...' }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'url' | 'upload'>('url');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Use PNG, JPG, SVG, or WEBP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum 5MB.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: file.name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary, #ccc)' }}>{label}</label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => setMode('url')}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid',
              borderColor: mode === 'url' ? 'var(--color-brand-400, #6C38FF)' : 'rgba(255,255,255,0.1)',
              background: mode === 'url' ? 'rgba(108,56,255,0.15)' : 'transparent',
              color: mode === 'url' ? 'var(--color-brand-400, #6C38FF)' : 'var(--text-muted, #888)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <LinkIcon size={10} /> URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid',
              borderColor: mode === 'upload' ? 'var(--color-brand-400, #6C38FF)' : 'rgba(255,255,255,0.1)',
              background: mode === 'upload' ? 'rgba(108,56,255,0.15)' : 'transparent',
              color: mode === 'upload' ? 'var(--color-brand-400, #6C38FF)' : 'var(--text-muted, #888)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Upload size={10} /> Upload
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: '#fff',
            fontSize: 13,
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            padding: '16px 12px',
            borderRadius: 8,
            border: '2px dashed rgba(108,56,255,0.3)',
            background: 'rgba(108,56,255,0.04)',
            cursor: uploading ? 'wait' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(108,56,255,0.6)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(108,56,255,0.3)')}
        >
          {uploading ? (
            <>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={20} color="var(--color-brand-400, #6C38FF)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Click to upload PNG, SVG, JPG, or WEBP (max 5MB)
              </span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg,.webp,.gif"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {error && (
        <span style={{ fontSize: 11, color: 'var(--color-critical, #ef4444)' }}>{error}</span>
      )}

      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Image size={14} color="var(--text-muted)" />
          <img
            src={value}
            alt="preview"
            style={{
              width: 36, height: 36, borderRadius: 8, objectFit: 'cover',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value.length > 60 ? `${value.slice(0, 60)}...` : value}
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)' }}
            title="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
