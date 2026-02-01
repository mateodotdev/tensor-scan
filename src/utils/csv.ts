import type { Transaction } from '../types/transaction';

function formatAwakenDate(date: Date): string {
  const year = String(date.getUTCFullYear()).slice(-2);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function formatCSVAmount(amount: number): string {
  if (amount === 0) return '0';
  return Math.abs(amount).toFixed(8).replace(/\.?0+$/, '');
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateAwakenCSV(transactions: Transaction[]): string {
  const headers = [
    'Date',
    'Asset',
    'Amount',
    'Fee',
    'P&L',
    'Payment Token',
    'ID',
    'Notes',
    'Tag',
    'Transaction Hash',
  ];

  const rows = transactions.map((tx) => {
    const date = formatAwakenDate(tx.date);
    const isSent = tx.type === 'sent';
    const amount = isSent ? -Math.abs(tx.amount) : Math.abs(tx.amount);

    return [
      date,
      'TAO',
      formatCSVAmount(amount),
      formatCSVAmount(tx.fee),
      '',
      'TAO',
      tx.id,
      `Bittensor ${tx.type} transaction`,
      isSent ? 'send' : 'receive',
      tx.txHash,
    ];
  });

  return [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => escapeCSV(cell)).join(',')),
  ].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
