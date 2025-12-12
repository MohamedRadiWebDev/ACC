// خفيف لتصدير قوالب XLSX بدون الاعتماد على حزم خارجية في بيئة الاختبار
export type Sheet = string[][];

export const utils = {
  aoa_to_sheet(data: any[][]): Sheet {
    return data.map((row) => row.map((cell) => String(cell ?? '')));
  },
  book_new() {
    return { sheets: {} as Record<string, Sheet> };
  },
  book_append_sheet(workbook: { sheets: Record<string, Sheet> }, sheet: Sheet, name: string) {
    workbook.sheets[name] = sheet;
  },
};

export function writeFile(workbook: { sheets: Record<string, Sheet> }, filename: string) {
  const [first] = Object.values(workbook.sheets);
  const csv = (first || []).map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/\.xlsx$/, '.csv');
  a.click();
  URL.revokeObjectURL(url);
}
