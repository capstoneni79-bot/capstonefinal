import React, { useState } from 'react';
import { Database, Download, Upload, RefreshCw, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, onDataRestored }) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const backup = storageService.exportFullBackup();
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DA_Hinunangan_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('Full database exported successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const success = storageService.restoreFullBackup(parsed);
        if (success) {
          setSuccessMessage('Database restored successfully from file!');
          onDataRestored();
          setTimeout(() => {
            setSuccessMessage(null);
            onClose();
          }, 1500);
        } else {
          setErrorMessage('Invalid backup file structure.');
        }
      } catch (err) {
        setErrorMessage('Failed to read JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all records to initial Hinunangan capstone demo data? Any custom records will be replaced.')) {
      storageService.resetToDefaults();
      setSuccessMessage('System restored to clean Hinunangan demo state!');
      onDataRestored();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Offline Database Backup & Restore</h3>
              <p className="text-[11px] text-stone-400">Manage local storage, offline data export & resets</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Export */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-stone-900 block text-xs">Export Complete System Snapshot</span>
              <p className="text-stone-500 text-[11px]">Download all swine, farmers, barangays, accounts, and logs as JSON.</p>
            </div>
            <button
              onClick={handleExportJson}
              className="bg-white hover:bg-stone-100 text-emerald-800 border border-emerald-400 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-stone-900 block text-xs">Restore From JSON File</span>
              <p className="text-stone-500 text-[11px]">Upload a previously saved database file.</p>
            </div>
            <label className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" /> Restore
              <input type="file" accept=".json,application/json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>

          {/* Reset */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-red-900 block text-xs">Reset Capstone Demonstration Data</span>
              <p className="text-red-700/80 text-[11px]">Restore standard Hinunangan initial data set.</p>
            </div>
            <button
              onClick={handleResetDefaults}
              className="bg-white hover:bg-red-50 text-red-700 border border-red-300 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset All
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
