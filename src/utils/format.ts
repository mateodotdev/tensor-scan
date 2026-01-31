export function formatAmount(amount: number): string {
  if (amount === 0) return '0';
  if (amount < 0.0001) return amount.toExponential(4);
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 16) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function truncateHash(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...`;
}
