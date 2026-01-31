import './SearchCard.css';

interface SearchCardProps {
  walletAddress: string;
  onAddressChange: (address: string) => void;
  onFetch: () => void;
  isLoading: boolean;
  error: string | null;
}

export function SearchCard({
  walletAddress,
  onAddressChange,
  onFetch,
  isLoading,
  error,
}: SearchCardProps) {
  return (
    <div className="card search-card">
      <div className="input-group">
        <label htmlFor="wallet-address">Wallet Address (Coldkey)</label>
        <input
          type="text"
          id="wallet-address"
          placeholder="5F3sa2TJAWMqDhXG6jhV4N8ko9gKph2TGpR67TgeSmDTxXGk"
          spellCheck="false"
          value={walletAddress}
          onChange={(e) => onAddressChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onFetch()}
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={onFetch}
        disabled={isLoading}
      >
        {isLoading ? 'Fetching...' : 'Fetch Transactions'}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
