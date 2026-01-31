import type { Transaction } from '../types/transaction';

function formatAwakenDate(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
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
    'Sent Quantity',
    'Sent Currency',
    'Received Quantity',
    'Received Currency',
    'Fee Amount',
    'Fee Currency',
    'Transaction Hash',
    'Notes',
  ];

  const rows = transactions.map((tx) => {
    const date = formatAwakenDate(tx.date);
    const isSent = tx.type === 'sent';

    return [
      date,
      isSent ? formatCSVAmount(tx.amount) : '',
      isSent ? 'TAO' : '',
      !isSent ? formatCSVAmount(tx.amount) : '',
      !isSent ? 'TAO' : '',
      formatCSVAmount(tx.fee),
      'TAO',
      tx.txHash,
      `Bittensor ${tx.type} transaction`,
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
