import type { RawTransfer, Transaction, ApiResponse } from '../types/transaction';

const API_TIMEOUT_MS = 30000;

const getApiKey = (): string => {
  const key = import.meta.env.VITE_TAOSTATS_API_KEY;
  if (!key || key === 'your_api_key_here') {
    throw new Error('Please set your VITE_TAOSTATS_API_KEY in .env file');
  }
  return key;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const RATE_LIMIT_DELAY_MS = 2500; // Delay between paginated requests (2.5s)
const RETRY_DELAY_MS = 5000; // Delay before retrying after rate limit (5s)
const MAX_RETRIES = 2;
const MAX_PAGES = 5; // Max 1000 transactions to stay within rate limits

export async function fetchTransactions(address: string): Promise<RawTransfer[]> {
  const key = getApiKey();
  const allTransfers: RawTransfer[] = [];
  const PAGE_SIZE = 200; // Taostats API max per page
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= MAX_PAGES) {
    // Add delay between requests to avoid rate limiting (skip first request)
    if (page > 1) {
      await delay(RATE_LIMIT_DELAY_MS);
    }

    const url = `https://api.taostats.io/api/transfer/v1?network=finney&coldkey=${address}&limit=${PAGE_SIZE}&page=${page}`;
    
    let retries = 0;
    let success = false;

    while (!success && retries < MAX_RETRIES) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Authorization': key,
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Invalid API key. Please check your VITE_TAOSTATS_API_KEY in .env');
          }
          if (response.status === 404) {
            throw new Error('Wallet not found or API endpoint error.');
          }
          if (response.status === 429) {
            retries++;
            if (retries < MAX_RETRIES) {
              clearTimeout(timeoutId);
              await delay(RETRY_DELAY_MS * retries); // Exponential backoff
              continue;
            }
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
          }
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data: ApiResponse = await response.json();

        let transfers: RawTransfer[] = [];
        if (Array.isArray(data)) {
          transfers = data;
        } else if (data.data && Array.isArray(data.data)) {
          transfers = data.data;
        } else if (data.transfers && Array.isArray(data.transfers)) {
          transfers = data.transfers;
        }

        allTransfers.push(...transfers);

        // Stop if we got fewer results than requested (last page)
        if (transfers.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          page++;
        }
        success = true;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  return allTransfers;
}

export const PAGE_SIZE = 200;

export interface FetchPageResult {
  transfers: RawTransfer[];
  hasMore: boolean;
}

export async function fetchTransactionPage(address: string, page: number): Promise<FetchPageResult> {
  const key = getApiKey();
  const url = `https://api.taostats.io/api/transfer/v1?network=finney&coldkey=${address}&limit=${PAGE_SIZE}&page=${page}`;
  
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Authorization': key,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API key. Please check your VITE_TAOSTATS_API_KEY in .env');
        }
        if (response.status === 404) {
          throw new Error('Wallet not found or API endpoint error.');
        }
        if (response.status === 429) {
          retries++;
          if (retries < MAX_RETRIES) {
            clearTimeout(timeoutId);
            await delay(RETRY_DELAY_MS * retries);
            continue;
          }
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      let transfers: RawTransfer[] = [];
      if (Array.isArray(data)) {
        transfers = data;
      } else if (data.data && Array.isArray(data.data)) {
        transfers = data.data;
      } else if (data.transfers && Array.isArray(data.transfers)) {
        transfers = data.transfers;
      }

      return {
        transfers,
        hasMore: transfers.length >= PAGE_SIZE
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error('Max retries exceeded');
}

export function parseTransactions(transfers: RawTransfer[], walletAddress: string): Transaction[] {
  return transfers.map((tx, index) => {

    const fromAddress = typeof tx.from === 'object' && tx.from?.ss58 
      ? tx.from.ss58 
      : (tx.from || tx.from_address || tx.sender || '');
    const toAddress = typeof tx.to === 'object' && tx.to?.ss58 
      ? tx.to.ss58 
      : (tx.to || tx.to_address || tx.recipient || '');
    const isSent = String(fromAddress).toLowerCase() === walletAddress.toLowerCase();

    let amount = parseFloat(String(tx.amount || tx.value || 0));
    if (amount > 1e9) amount = amount / 1e9;

    let fee = parseFloat(String(tx.fee || tx.transaction_fee || 0));
    if (fee > 1e9) fee = fee / 1e9;


    let timestamp: Date;
    if (tx.timestamp) {
      timestamp = new Date(tx.timestamp);
    } else if (tx.block_timestamp) {
      timestamp = new Date(tx.block_timestamp);
    } else {
      timestamp = new Date();
    }


    const txHash = tx.transaction_hash || tx.extrinsic_id || tx.hash || tx.tx_hash || '';
    

    const transactionId = tx.id || tx.extrinsic_id || `${tx.block_number || ''}-${index}`;

    return {
      id: transactionId,
      date: timestamp,
      type: isSent ? 'sent' : 'received',
      amount,
      fee,
      counterparty: String(isSent ? toAddress : fromAddress),
      txHash,
      blockNumber: tx.block_number || '',
    };
  });
}
