import './SearchCard.css';

interface SearchCardProps {
  walletAddress: string;
  onAddressChange: (address: string) => void;
  onFetch: () => void;
  isLoading: boolean;
  error: string | null;
}

// Basic SS58 address validation for Bittensor
const isValidAddress = (addr: string): boolean => {
  const trimmed = addr.trim();
  return trimmed.length >= 47 && trimmed.length <= 48 && trimmed.startsWith('5');
};

export function SearchCard({
  walletAddress,
  onAddressChange,
  onFetch,
  isLoading,
  error,
}: SearchCardProps) {
  const trimmedAddress = walletAddress.trim();
  const isValid = isValidAddress(trimmedAddress);
  const showValidationHint = trimmedAddress.length > 0 && !isValid;

  return (
    <div className="card search-card">
      <div className="input-group">
        <label htmlFor="wallet-address">Wallet Address (Coldkey)</label>
        <input
          type="text"
          id="wallet-address"
          placeholder="5F3sa2TJAWMqDhXG6jhV4N8ko9gKph2TGpR67TgeSmDTxXGk"
          spellCheck="false"
          autoComplete="off"
          aria-label="Enter your Bittensor wallet address"
          aria-invalid={showValidationHint}
          value={walletAddress}
          onChange={(e) => onAddressChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && isValid && onFetch()}
        />
        {showValidationHint && (
          <div className="validation-hint">Address should start with 5 and be 47-48 characters</div>
        )}
      </div>
      <button
        className="btn btn-primary"
        onClick={onFetch}
        disabled={isLoading || !isValid}
        aria-label="Fetch transactions for this wallet"
      >
        {isLoading ? 'Fetching...' : 'Fetch Transactions'}
      </button>
      {error && <div className="error-message" role="alert">{error}</div>}
    </div>
  );
}
