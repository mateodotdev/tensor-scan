// Taostats API address object
interface TaostatsAddress {
  ss58: string;
  hex: string;
}

export interface RawTransfer {
  id?: string;
  block_number?: number;
  extrinsic_id?: string;
  extrinsic_index?: number;
  hash?: string;
  tx_hash?: string;
  transaction_hash?: string;
  from?: string | TaostatsAddress;
  from_address?: string;
  sender?: string;
  to?: string | TaostatsAddress;
  to_address?: string;
  recipient?: string;
  amount?: number | string;
  value?: number | string;
  fee?: number | string;
  transaction_fee?: number | string;
  timestamp?: number | string;
  block_timestamp?: string;
  network?: string;
}

export interface Transaction {
  id: string;
  date: Date;
  type: 'sent' | 'received';
  amount: number;
  fee: number;
  counterparty: string;
  txHash: string;
  blockNumber: number | string;
}

export interface TransactionStats {
  total: number;
  totalSent: number;
  totalReceived: number;
}

export type SortField = 'date' | 'type' | 'amount' | 'counterparty' | 'fee';
export type SortDirection = 'asc' | 'desc';

export interface ApiResponse {
  data?: RawTransfer[];
  transfers?: RawTransfer[];
  [key: string]: unknown;
}
