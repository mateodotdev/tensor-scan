import { useState, useCallback, useMemo } from "react";
import "./App.css";
import type {
  Transaction,
  SortField,
  SortDirection,
  TransactionStats,
} from "./types/transaction";
import { fetchTransactionPage, parseTransactions, PAGE_SIZE } from "./services/api";
import { generateAwakenCSV, downloadCSV } from "./utils/csv";
import { Header } from "./components/Header";
import { SearchCard } from "./components/SearchCard";
import { StatsBar } from "./components/StatsBar";
import { TransactionTable } from "./components/TransactionTable";
import { Pagination } from "./components/Pagination";

const ITEMS_PER_PAGE = 25;

function App() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [savedAddress, setSavedAddress] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [apiPage, setApiPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");


  const stats = useMemo<TransactionStats>(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type === "sent") acc.totalSent += tx.amount;
        else acc.totalReceived += tx.amount;
        return acc;
      },
      { total: transactions.length, totalSent: 0, totalReceived: 0 }
    );
  }, [transactions]);


  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA instanceof Date && valB instanceof Date) {
        return (valA.getTime() - valB.getTime()) * dir;
      }
      if (typeof valA === "string" && typeof valB === "string") {
        return valA.localeCompare(valB) * dir;
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * dir;
      }
      return 0;
    });
  }, [transactions, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );


  const handleFetchTransactions = useCallback(async (): Promise<void> => {
    const trimmedAddress = walletAddress.trim();
    if (!trimmedAddress) {
      setError("Please enter a wallet address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTransactions([]);
    setApiPage(1);
    setHasMore(false);
    setSavedAddress(trimmedAddress);

    try {
      const result = await fetchTransactionPage(trimmedAddress, 1);
      const parsedTransactions = parseTransactions(
        result.transfers,
        trimmedAddress
      );

      if (parsedTransactions.length === 0) {
        setError("No transactions found for this wallet.");
      } else {
        setTransactions(parsedTransactions);
        setCurrentPage(1);
        setHasMore(result.hasMore);
        setApiPage(2);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transactions"
      );
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  const handleLoadMore = useCallback(async (): Promise<void> => {
    if (isLoadingMore || !hasMore || !savedAddress) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await fetchTransactionPage(savedAddress, apiPage);
      const parsedTransactions = parseTransactions(
        result.transfers,
        savedAddress
      );

      if (parsedTransactions.length > 0) {
        setTransactions(prev => [...prev, ...parsedTransactions]);
        setHasMore(result.hasMore);
        setApiPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more transactions"
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [apiPage, hasMore, isLoadingMore, savedAddress]);

  const handleSortChange = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleExportCSV = (): void => {
    if (transactions.length === 0) return;
    const csvContent = generateAwakenCSV(sortedTransactions);
    downloadCSV(
      csvContent,
      `bittensor_transactions_${walletAddress.slice(0, 8)}.csv`
    );
  };

  const hasTransactions = transactions.length > 0;
  const showResults = hasTransactions && !isLoading;

  return (
    <div className="app">
      <Header />

      <main className="main">
        <section className="hero">
          <h1>Bittensor Transaction Viewer</h1>
          <p>
            Enter your wallet address to view transactions and export as csv
            format
          </p>
        </section>

        <SearchCard
          walletAddress={walletAddress}
          onAddressChange={setWalletAddress}
          onFetch={handleFetchTransactions}
          isLoading={isLoading}
          error={error}
        />

        {isLoading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching transactions...</p>
          </div>
        )}

        {showResults && (
          <div className="results-section">
            <StatsBar stats={stats} onExport={handleExportCSV} />
            <TransactionTable
              transactions={paginatedTransactions}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSortChange}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            {hasMore && (
              <div className="load-more-section">
                <p className="load-more-info">
                  Showing {transactions.length} transactions
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : `Load ${PAGE_SIZE} More`}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          built by{" "}
          <a
            href="https://twitter.com/mateoinrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            mateo
          </a>{" "}
          for{" "}
          <a
            href="https://awaken.tax"
            target="_blank"
            rel="noopener noreferrer"
          >
            awaken tax
          </a>
        </p>
        <p className="footer-note">
          Data provided by{" "}
          <a
            href="https://taostats.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            Taostats API
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
