import {  FileSpreadsheet, FileJson } from 'lucide-react';
import styles from './ExportButton.module.css';

export interface ExportColumn<T> {
  key: string;
  label: string;
  formatter?: (value: any, row: T) => string;
}

type ExportButtonProps<T> = {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  label?: string;
}

export function ExportButton<T>({ data, columns, filename, label = 'Export' }: ExportButtonProps<T>) {
  const downloadCSV = () => {
    if (!data || data.length === 0) return;

    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(row => {
      return columns.map(col => {
        const value = (row as any)[col.key];
        const formatted = col.formatter ? col.formatter(value, row) : value;
        const str = String(formatted ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    }).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!data || data.length === 0) return;

    const exportData = data.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        const value = (row as any)[col.key];
        obj[col.label] = col.formatter ? col.formatter(value, row) : value;
      });
      return obj;
    });

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.exportContainer}>
      <button
        onClick={downloadCSV}
        disabled={!data || data.length === 0}
        className={styles.exportButton}
        title="Export as CSV"
      >
        <FileSpreadsheet size={16} />
        <span>{label}</span>
      </button>
      <button
        onClick={downloadJSON}
        disabled={!data || data.length === 0}
        className={`${styles.exportButton} ${styles.secondary}`}
        title="Export as JSON"
      >
        <FileJson size={16} />
      </button>
    </div>
  );
}
