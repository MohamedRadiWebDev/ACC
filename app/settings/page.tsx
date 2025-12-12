'use client';

import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exportAll, seedDemo } from '@/lib/repo';
import { generateTemplateCSV } from '@/lib/utils';

export default function SettingsPage() {
  const { push } = useToast();

  const download = async () => {
    const blob = new Blob([await exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup.json';
    a.click();
  };

  const downloadTemplate = () => {
    const blob = new Blob([generateTemplateCSV()], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'template.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">الإعدادات</h1>
      <Card>
        <CardHeader>
          <CardTitle>نسخ احتياطي واستيراد</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={download}>تصدير كامل (JSON)</Button>
          <label className="border rounded px-3 py-2 cursor-pointer">
            استيراد JSON
            <input
              type="file"
              className="hidden"
              accept="application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                JSON.parse(text);
                indexedDB.deleteDatabase('ledger-db');
                window.location.reload();
                push({ title: 'تمت الاستعادة' });
              }}
            />
          </label>
          <Button variant="secondary" onClick={downloadTemplate}>
            تحميل نموذج CSV
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>بيانات تجريبية</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => seedDemo()}>تفريغ وإعادة ضبط</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>دمج Google Sheets (اختياري)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>زر الاتصال يعمل كمكان مخصص لإضافة OAuth لاحقاً.</p>
          <Button variant="outline">الاتصال بـ Google</Button>
          <p className="text-xs text-muted-foreground">
            استخدم مسارات /api/google/auth و /api/google/push و /api/google/pull عند إضافة بيانات اعتماد API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
