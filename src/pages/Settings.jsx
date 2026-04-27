import React from 'react';
import {
  Download,
  Upload,
  Trash2,
  Database,
  Info,
  ShieldCheck
} from 'lucide-react';
import { Card, SectionHeader } from '../components/UI';
import { db } from '../db';
import { useFeedback } from '../context/feedbackContext';

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });

const dataUrlToBlob = async (dataUrl) => {
  const res = await fetch(dataUrl);
  return await res.blob();
};

const normalizeRoutine = (routine) => {
  const recurrenceType = routine.recurrenceType ?? routine.recurrence?.type ?? 'daily';
  const createdAt = routine.createdAt ?? new Date().toISOString();
  const taskType = routine.taskType ?? 'checkbox';
  const normalized = {
    ...routine,
    name: (routine.name ?? routine.title ?? '').trim(),
    recurrenceType,
    recurrenceDays: routine.recurrenceDays ?? routine.recurrence?.days ?? null,
    recurrenceInterval: routine.recurrenceInterval ?? routine.recurrence?.interval ?? null,
    taskType,
    counterTarget: taskType === 'counter' ? Number(routine.counterTarget ?? 1) : routine.counterTarget ?? null,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
  };
  delete normalized.title;
  delete normalized.time;
  delete normalized.recurrence;
  return normalized;
};

const SettingsPage = () => {
  const { showToast, confirm } = useFeedback();

  const exportData = async () => {
    const routines = await db.routines.toArray();
    const completions = await db.completions.toArray();
    const settings = await db.settings.toArray();

    const exportedCompletions = await Promise.all(
      completions.map(async (c) => {
        if (!c.photoBlob) return c;
        const { photoBlob, ...rest } = c;
        const photoBase64 = await blobToDataUrl(photoBlob);
        return { ...rest, photoBase64 };
      })
    );

    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      routines,
      completions: exportedCompletions,
      settings,
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
          await db.settings.clear();
          if (data.routines) await db.routines.bulkAdd(data.routines.map(normalizeRoutine));

          if (data.completions) {
            const importedCompletions = await Promise.all(
              data.completions.map(async (c) => {
                if (!c.photoBase64) return c;
                const { photoBase64, ...rest } = c;
                const photoBlob = await dataUrlToBlob(photoBase64);
                return { ...rest, photoBlob };
              })
            );
            await db.completions.bulkAdd(
              importedCompletions.map((c) => ({
                counterValue: c.counterValue ?? null,
                photoBlob: c.photoBlob ?? null,
                ...c,
              }))
            );
          }

          if (data.settings) await db.settings.bulkAdd(data.settings);
          showToast('Systems restored', 'success');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch {
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
      await db.settings.clear();
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
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <Info size={20} className="text-[#3B82F6]" />
                <span className="font-bold text-white">Platform</span>
              </div>
              <span className="bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">Optimized</span>
            </div>
          </Card>
        </section>

        <div className="text-center pb-8">
          <p className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest mb-1">Improve Persona</p>
          <p className="text-[10px] text-[#4B5563]/50">Engine v1.0.5 • Native Link</p>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
