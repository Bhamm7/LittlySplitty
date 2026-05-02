import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, FileText, Loader2, X } from 'lucide-react';
import { uploadFile, confirmImport } from '../api/imports.js';
import type { ImportPreview } from '@littysplitty/shared';
import UserSelector from '../components/UserSelector.js';
import { useUserContext } from '../contexts/UserContext.js';

type FileStatus = 'pending' | 'processing' | 'done' | 'error' | 'duplicate';

interface FileEntry {
  file: File;
  status: FileStatus;
  preview?: ImportPreview;
  result?: { transactions_imported: number; rules_applied_count: number };
  error?: string;
}

export default function ImportPage() {
  const { selectedUserId } = useUserContext();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<{ transactions_imported: number; rules_applied_count: number } | null>(null);
  const [queue, setQueue] = useState<FileEntry[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const qc = useQueryClient();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/pdf': ['.pdf'],
    },
    onDrop: async (files) => {
      if (files.length === 0) return;
      if (!selectedUserId) {
        setSingleError('Please select a user before importing.');
        return;
      }

      if (files.length === 1) {
        // Single file: show preview/confirm flow
        setSingleError(null);
        setSingleResult(null);
        setPreview(null);
        setQueue([]);
        setSingleLoading(true);
        try {
          const p = await uploadFile(files[0], selectedUserId);
          setPreview(p);
        } catch (err: any) {
          setSingleError(err.response?.data?.error || err.message);
        } finally {
          setSingleLoading(false);
        }
      } else {
        // Multiple files: batch auto-import
        setPreview(null);
        setSingleError(null);
        setSingleResult(null);
        const entries: FileEntry[] = files.map((f) => ({ file: f, status: 'pending' }));
        setQueue(entries);
        setBatchRunning(true);

        const updated = [...entries];
        for (let i = 0; i < updated.length; i++) {
          updated[i] = { ...updated[i], status: 'processing' };
          setQueue([...updated]);
          try {
            const p = await uploadFile(updated[i].file, selectedUserId);
            const r = await confirmImport(p.file_hash);
            updated[i] = {
              ...updated[i],
              status: r.transactions_imported === 0 ? 'duplicate' : 'done',
              preview: p,
              result: r,
            };
          } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            updated[i] = { ...updated[i], status: 'error', error: msg };
          }
          setQueue([...updated]);
        }

        setBatchRunning(false);
        qc.invalidateQueries({ queryKey: ['transactions'] });
        qc.invalidateQueries({ queryKey: ['stats'] });
        qc.invalidateQueries({ queryKey: ['imports'] });
      }
    },
  });

  async function handleConfirm() {
    if (!preview) return;
    setSingleLoading(true);
    setSingleError(null);
    try {
      const r = await confirmImport(preview.file_hash);
      setSingleResult(r);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['imports'] });
    } catch (err: any) {
      setSingleError(err.response?.data?.error || err.message);
    } finally {
      setSingleLoading(false);
    }
  }

  const statusIcon = (s: FileStatus) => {
    if (s === 'processing') return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (s === 'done') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (s === 'duplicate') return <CheckCircle className="w-4 h-4 text-gray-400" />;
    if (s === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  };

  const statusText = (entry: FileEntry) => {
    if (entry.status === 'pending') return <span className="text-gray-400">Waiting...</span>;
    if (entry.status === 'processing') return <span className="text-blue-500">Processing...</span>;
    if (entry.status === 'done') return (
      <span className="text-green-600">
        {entry.result!.transactions_imported} imported
        {entry.result!.rules_applied_count > 0 && `, ${entry.result!.rules_applied_count} rules applied`}
      </span>
    );
    if (entry.status === 'duplicate') return <span className="text-gray-400">Already imported (no new transactions)</span>;
    if (entry.status === 'error') return <span className="text-red-500">{entry.error}</span>;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Import Statements</h2>

      <UserSelector />

      {!selectedUserId && (
        <div className="mb-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Select a user above to import transactions for. "All" is not valid for imports.
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${batchRunning ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg text-gray-600">
          {isDragActive ? 'Drop files here...' : 'Drag & drop bank statements, or click to select'}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          CSV (Tangerine credit/debit, Amex) · XLS/XLSX (Amex) · PDF (TD chequing, savings, credit) · Drop multiple files to batch import
        </p>
      </div>

      {singleLoading && (
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
        </div>
      )}

      {singleError && (
        <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {singleError}
        </div>
      )}

      {/* Single file preview */}
      {preview && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              {preview.parser_key.includes('pdf') ? (
                <FileText className="w-5 h-5 text-amber-600" />
              ) : (
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <p className="font-semibold">{preview.bank_source}</p>
                <p className="text-sm text-gray-500">
                  {preview.transaction_count} transactions · {preview.date_range_start} to {preview.date_range_end}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.sample_rows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 whitespace-nowrap">{row.transaction_date}</td>
                    <td className="px-4 py-3">{row.description}</td>
                    <td className="px-4 py-3 text-right font-mono">${row.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        row.is_credit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {row.is_credit ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.transaction_count > 10 && (
            <p className="px-4 py-2 text-sm text-gray-400">Showing 10 of {preview.transaction_count} transactions</p>
          )}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={singleLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Confirm Import
            </button>
          </div>
        </div>
      )}

      {/* Single file result */}
      {singleResult && (
        <div className="mt-6 flex items-center gap-3 text-green-700 bg-green-50 p-6 rounded-lg">
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-semibold">Import successful!</p>
            <p className="text-sm">
              {singleResult.transactions_imported} transactions imported.
              {singleResult.rules_applied_count > 0 && ` ${singleResult.rules_applied_count} rules auto-applied.`}
            </p>
          </div>
        </div>
      )}

      {/* Batch queue */}
      {queue.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="font-semibold">Batch Import — {queue.length} files</p>
            {!batchRunning && (
              <button onClick={() => setQueue([])} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <ul className="divide-y divide-gray-100">
            {queue.map((entry, i) => (
              <li key={i} className="flex items-center gap-3 px-6 py-3">
                {statusIcon(entry.status)}
                <span className="text-sm text-gray-700 flex-1 truncate">{entry.file.name}</span>
                <span className="text-sm">{statusText(entry)}</span>
              </li>
            ))}
          </ul>
          {!batchRunning && (
            <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
              {queue.filter(e => e.status === 'done').reduce((s, e) => s + (e.result?.transactions_imported || 0), 0)} total transactions imported
            </div>
          )}
        </div>
      )}
    </div>
  );
}
