import React, { useState } from 'react';
import {
  Download,
  Upload,
  Trash2,
  Bell,
  ShieldCheck,
  Database,
  Info
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, SectionHeader, Button } from '../components/UI';
import { db } from '../db';
import { useFeedback } from '../context/FeedbackContext';

const SettingsPage = () => {
  const { showToast, confirm } = useFeedback();
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    const routines = await db.routines.toArray();
    const completions = await db.completions.toArray();

    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      routines,
      completions
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `improve-persona-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExporting(false);
    showToast('Backup downloaded', 'info');
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const isConfirmed = await confirm({
          title: 'Import Backup?',
          message: 'Existing protocols and history will be replaced by the backup data.',
          confirmText: 'Import'
        });

        if (isConfirmed) {
          await db.routines.clear();
          await db.completions.clear();
          await db.routines.bulkAdd(data.routines);
          await db.completions.bulkAdd(data.completions);
          showToast('Systems restored', 'success');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        showToast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const resetData = async () => {
    const isConfirmed = await confirm({
      title: 'Factory Reset?',
      message: 'CRITICAL: This will destroy all protocols and history. This action is irreversible.',
      variant: 'danger',
      confirmText: 'Format Data'
    });

    if (isConfirmed) {
      await db.routines.clear();
      await db.completions.clear();
      showToast('System wiped');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <>
      <SectionHeader title="Settings" subtitle="System configuration" />

      <div className="space-y-8">
        {/* Data Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Database size={14} className="text-[#3B82F6]" />
            <h4 className="text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em]">Data Management</h4>
          </div>
          <Card className="p-0 overflow-hidden divide-y divide-white/5">
            <div onClick={exportData} className="flex items-center justify-between p-6 hover:bg-white/5 cursor-pointer transition-colors group">
              <div className="flex items-center gap-4">
                <Download size={20} className="text-[#3B82F6]" />
                <span className="font-bold text-white">Export Backup</span>
              </div>
              <span className="text-[10px] text-[#4B5563] font-bold uppercase group-hover:text-[#3B82F6] transition-colors">JSON</span>
            </div>

            <label className="flex items-center justify-between p-6 hover:bg-white/5 cursor-pointer transition-colors group">
              <div className="flex items-center gap-4">
                <Upload size={20} className="text-[#10B981]" />
                <span className="font-bold text-white">Import Backup</span>
              </div>
              <input type="file" accept=".json" onChange={importData} className="hidden" />
              <span className="text-[10px] text-[#4B5563] font-bold uppercase group-hover:text-[#10B981] transition-colors">Select File</span>
            </label>

            <div onClick={resetData} className="flex items-center justify-between p-6 hover:bg-white/5 cursor-pointer transition-colors group">
              <div className="flex items-center gap-4">
                <Trash2 size={20} className="text-red-500" />
                <span className="font-bold text-white">Wipe All Data</span>
              </div>
              <span className="text-[10px] text-red-500/50 font-bold uppercase group-hover:text-red-500 transition-colors underline decoration-red-500/20">Danger</span>
            </div>
          </Card>
        </section>

        {/* System Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-2">
            <ShieldCheck size={14} className="text-[#10B981]" />
            <h4 className="text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em]">App Status</h4>
          </div>
          <Card className="p-0 overflow-hidden divide-y divide-white/5">
            <div className="flex items-center justify-between p-6 opacity-50">
              <div className="flex items-center gap-4">
                <Bell size={20} className="text-[#F59E0B]" />
                <span className="font-bold text-white">Notifications</span>
              </div>
              <div className="w-10 h-5 bg-[#374151] rounded-full relative">
                <div className="absolute left-1 top-1 w-3 h-3 bg-[#4B5563] rounded-full" />
              </div>
            </div>

            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <Info size={20} className="text-[#3B82F6]" />
                <span className="font-bold text-white">PWA Status</span>
              </div>
              <span className="bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">Optimized</span>
            </div>
          </Card>
        </section>

        <div className="text-center pb-8">
          <p className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest mb-1">Improve Persona</p>
          <p className="text-[10px] text-[#4B5563]/50">Engine v1.0.4 • Protocol 01</p>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
