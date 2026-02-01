import "./StatsBar.css";
import type { TransactionStats } from "../types/transaction";
import { formatAmount } from "../utils/format";

interface StatsBarProps {
  stats: TransactionStats;
  onExport: () => void;
}

export function StatsBar({ stats, onExport }: StatsBarProps) {
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-label">Total Transactions</span>
        <span className="stat-value">{stats.total.toLocaleString()}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Total Sent</span>
        <span className="stat-value">{formatAmount(stats.totalSent)} TAO</span>
      </div>
      <div className="stat">
        <span className="stat-label">Total Received</span>
        <span className="stat-value">
          {formatAmount(stats.totalReceived)} TAO
        </span>
      </div>
      <button className="btn btn-secondary" onClick={onExport} aria-label="Export transactions as CSV">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 12l-4-4h2.5V3h3v5H12L8 12z" />
          <path d="M14 13v1H2v-1h12z" />
        </svg>
        Export CSV
      </button>
    </div>
  );
}
