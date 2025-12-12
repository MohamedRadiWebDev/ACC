'use client';

import { Card } from '@/components/ui/card';

export default function ReconciliationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">المطابقة</h1>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          استخدم هذه الصفحة لمراجعة التحويلات بين الخزنة والبنوك والمحافظ الرقمية. يتم اقتراح المطابقات حسب المبلغ والاتجاه
          والفترة الزمنية.
        </p>
      </Card>
    </div>
  );
}
