import './TransactionTable.css';
import type { Transaction, SortField, SortDirection } from '../types/transaction';
import { formatAmount, formatDate, truncateAddress, truncateHash } from '../utils/format';

const EXPLORER_URL = 'https://taostats.io';

interface TransactionTableProps {
  transactions: Transaction[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function SortIcon({ field, currentField, direction }: { 
  field: SortField; 
  currentField: SortField; 
  direction: SortDirection;
}) {
  const isActive = field === currentField;
  return (
    <span className={`sort-icon ${isActive ? 'sorted' : ''}`}>
      {isActive ? (direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );
}

export function TransactionTable({ 
  transactions, 
  sortField, 
  sortDirection, 
  onSort 
}: TransactionTableProps) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th onClick={() => onSort('date')}>
              Date <SortIcon field="date" currentField={sortField} direction={sortDirection} />
            </th>
            <th onClick={() => onSort('type')}>
              Type <SortIcon field="type" currentField={sortField} direction={sortDirection} />
            </th>
            <th onClick={() => onSort('amount')}>
              Amount <SortIcon field="amount" currentField={sortField} direction={sortDirection} />
            </th>
            <th onClick={() => onSort('counterparty')}>
              From/To <SortIcon field="counterparty" currentField={sortField} direction={sortDirection} />
            </th>
            <th onClick={() => onSort('fee')}>
              Fee <SortIcon field="fee" currentField={sortField} direction={sortDirection} />
            </th>
            <th>Tx Hash</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{formatDate(tx.date)}</td>
              <td>
                <span className={`badge badge-${tx.type}`}>
                  {tx.type === 'sent' ? '↑ Sent' : '↓ Received'}
                </span>
              </td>
              <td>
                <span className={`amount amount-${tx.type}`}>
                  {tx.type === 'sent' ? '-' : '+'}
                  {formatAmount(tx.amount)} TAO
                </span>
              </td>
              <td className="address">
                <a
                  href={`${EXPLORER_URL}/account/${tx.counterparty}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={tx.counterparty}
                >
                  {truncateAddress(tx.counterparty)}
                </a>
              </td>
              <td className="amount">{formatAmount(tx.fee)} TAO</td>
              <td className="address">
                <a
                  href={`${EXPLORER_URL}/extrinsic/${tx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={tx.txHash}
                >
                  {truncateHash(tx.txHash)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
