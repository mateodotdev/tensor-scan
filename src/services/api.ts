import type { RawTransfer, Transaction, ApiResponse } from '../types/transaction';

const API_BASE_URL = 'https://api.taostats.io/api/v1';

const getApiKey = (): string => {
  const key = import.meta.env.VITE_TAOSTATS_API_KEY;
  if (!key || key === 'your_api_key_here') {
    throw new Error('Please set your VITE_TAOSTATS_API_KEY in .env file');
  }
  return key;
};

export async function fetchTransactions(address: string): Promise<RawTransfer[]> {
  const url = `${API_BASE_URL}/transfer/coldkey?coldkey=${address}&limit=1000`;

  const response = await fetch(url, {
    headers: {
      'Authorization': getApiKey(),
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid API key. Please check your VITE_TAOSTATS_API_KEY in .env');
    }
    if (response.status === 404) {
      throw new Error('Wallet not found. Please check the address.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data: ApiResponse = await response.json();

  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.transfers && Array.isArray(data.transfers)) return data.transfers;
  return [];
}

export function parseTransactions(transfers: RawTransfer[], walletAddress: string): Transaction[] {
  return transfers.map((tx, index) => {
    const fromAddress = tx.from || tx.from_address || tx.sender || '';
    const toAddress = tx.to || tx.to_address || tx.recipient || '';
    const isSent = fromAddress.toLowerCase() === walletAddress.toLowerCase();

    let amount = parseFloat(String(tx.amount || tx.value || 0));
    if (amount > 1e9) amount = amount / 1e9;

    let fee = parseFloat(String(tx.fee || tx.transaction_fee || 0));
    if (fee > 1e9) fee = fee / 1e9;

    let timestamp: Date;
    if (tx.timestamp) {
      timestamp = typeof tx.timestamp === 'number' 
        ? new Date(tx.timestamp * 1000) 
        : new Date(tx.timestamp);
    } else if (tx.block_timestamp) {
      timestamp = new Date(tx.block_timestamp);
    } else {
      timestamp = new Date();
    }

    const txHash = tx.extrinsic_id || tx.hash || tx.tx_hash || `${tx.block_number || ''}-${tx.extrinsic_index || ''}`;

    return {
      id: `${txHash}-${index}`,
      date: timestamp,
      type: isSent ? 'sent' : 'received',
      amount,
      fee,
      counterparty: isSent ? toAddress : fromAddress,
      txHash,
      blockNumber: tx.block_number || '',
    };
  });
}
