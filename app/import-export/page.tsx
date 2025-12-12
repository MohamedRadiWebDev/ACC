'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { exportAll, importJson } from '@/lib/repo';
import * as XLSX from '@/lib/sheetjs';

export default function ImportExportPage() {
  const { push } = useToast();

  async function exportJsonFile() {
    const payload = await exportAll();
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>, mode: 'merge' | 'replace') {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    await importJson(parsed, mode);
    push({ title: 'تم الاستيراد' });
  }

  function exportBlankXlsx() {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['date', 'description', 'inAmount', 'outAmount'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'treasury');
    XLSX.writeFile(wb, 'template.xlsx');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">استيراد / تصدير</h1>
      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">النسخ الاحتياطي</h2>
        <div className="flex gap-2">
          <Button onClick={exportJsonFile}>تصدير JSON</Button>
          <label className="border rounded px-3 py-2 cursor-pointer">
            استيراد دمج
            <input type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e, 'merge')} />
          </label>
          <label className="border rounded px-3 py-2 cursor-pointer">
            استيراد استبدال
            <input type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e, 'replace')} />
          </label>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">نماذج Excel (SheetJS)</h2>
        <p className="text-sm text-muted-foreground">استخدم القوالب لتجهيز ملفات XLSX ثم استيرادها لاحقًا.</p>
        <Button onClick={exportBlankXlsx}>تنزيل قالب XLSX</Button>
      </Card>
    </div>
  );
}
