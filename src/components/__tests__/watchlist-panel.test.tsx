import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { WatchlistPanel } from "../watchlist-panel";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock useQuotePolling to control quote data
const mockRefresh = vi.fn();
vi.mock("@/hooks/use-quote-polling", () => ({
  useQuotePolling: () => ({
    quotes: mockQuotesData,
    isRefreshing: false,
    lastUpdated: null,
    refresh: mockRefresh,
    isMarketOpen: true,
    triggeredAlerts: [],
    hasError: false,
    isRateLimited: false,
  }),
}));

let mockQuotesData: Record<string, any> = {};

// Mock SymbolSearch to avoid testing its internals
vi.mock("../symbol-search", () => ({
  SymbolSearch: ({ onSelect }: { onSelect: (r: any) => void }) => (
    <button
      data-testid="mock-search-select"
      onClick={() =>
        onSelect({
          symbol: "GOOGL",
          name: "Alphabet Inc",
          exchange: "NASDAQ",
          type: "Common Stock",
          country: "United States",
        })
      }
    >
      Mock Search
    </button>
  ),
}));

const MOCK_WATCHLIST = {
  watchlist: {
    id: "wl-1",
    name: "La mia Watchlist",
    items: [
      {
        id: "item-1",
        sortOrder: 0,
        symbol: { ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
      },
      {
        id: "item-2",
        sortOrder: 1,
        symbol: {
          ticker: "MSFT",
          name: "Microsoft Corporation",
          exchange: "NASDAQ",
        },
      },
    ],
  },
};

const MOCK_EMPTY_WATCHLIST = {
  watchlist: {
    id: "wl-1",
    name: "La mia Watchlist",
    items: [],
  },
};

function mockFetchWatchlist(data: any) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data),
  });
}

describe("WatchlistPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockQuotesData = {};
  });

  it("shows loading state initially", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
    );

    render(<WatchlistPanel />);
    expect(screen.getByText("Caricamento watchlist...")).toBeDefined();
  });

  it("displays watchlist items with ticker and name", async () => {
    vi.stubGlobal("fetch", mockFetchWatchlist(MOCK_WATCHLIST));

    render(<WatchlistPanel />);

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeDefined();
      expect(screen.getByText("Apple Inc")).toBeDefined();
      expect(screen.getByText("MSFT")).toBeDefined();
      expect(screen.getByText("Microsoft Corporation")).toBeDefined();
    });
  });

  it("shows empty state with suggested tickers", async () => {
    vi.stubGlobal("fetch", mockFetchWatchlist(MOCK_EMPTY_WATCHLIST));

    render(<WatchlistPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("La tua watchlist è vuota. Inizia aggiungendo dei titoli!")
      ).toBeDefined();
      expect(screen.getByText("AAPL")).toBeDefined();
      expect(screen.getByText("MSFT")).toBeDefined();
      expect(screen.getByText("TSLA")).toBeDefined();
      expect(screen.getByText("Cerca un titolo")).toBeDefined();
    });
  });

  it("adds item via search with optimistic update", async () => {
    const fetchMock = vi
      .fn()
      // First call: GET watchlist
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(MOCK_EMPTY_WATCHLIST),
      })
      // Second call: POST add item
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({
          item: {
            id: "item-new",
            symbol: {
              ticker: "GOOGL",
              name: "Alphabet Inc",
              exchange: "NASDAQ",
            },
          },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<WatchlistPanel />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Aggiungi titolo")).toBeDefined();
    });

    // Open search
    fireEvent.click(screen.getByText("Aggiungi titolo"));

    // Click mock search result
    fireEvent.click(screen.getByTestId("mock-search-select"));

    // Optimistic update should show immediately
    await waitFor(() => {
      expect(screen.getByText("GOOGL")).toBeDefined();
      expect(screen.getByText("Alphabet Inc")).toBeDefined();
    });
  });

  it("shows feedback for duplicate item", async () => {
    const watchlistWithItems = {
      watchlist: {
        id: "wl-1",
        name: "La mia Watchlist",
        items: [
          {
            id: "item-1",
            sortOrder: 0,
            symbol: {
              ticker: "GOOGL",
              name: "Alphabet Inc",
              exchange: "NASDAQ",
            },
          },
        ],
      },
    };

    vi.stubGlobal("fetch", mockFetchWatchlist(watchlistWithItems));

    render(<WatchlistPanel />);

    await waitFor(() => {
      expect(screen.getByText("GOOGL")).toBeDefined();
    });

    // Open search
    fireEvent.click(screen.getByText("Aggiungi titolo"));

    // Try adding GOOGL again (same as mock search returns)
    fireEvent.click(screen.getByTestId("mock-search-select"));

    await waitFor(() => {
      expect(screen.getByText("Titolo già in watchlist")).toBeDefined();
    });
  });

  it("shows remove button on each item", async () => {
    vi.stubGlobal("fetch", mockFetchWatchlist(MOCK_WATCHLIST));

    render(<WatchlistPanel />);

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeDefined();
    });

    const removeButtons = screen.getAllByLabelText(/Rimuovi/);
    expect(removeButtons).toHaveLength(2);
  });

  it("removes item optimistically on click", async () => {
    const fetchMock = vi
      .fn()
      // GET watchlist
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(MOCK_WATCHLIST),
      })
      // DELETE item
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<WatchlistPanel />);

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeDefined();
    });

    // Click remove on AAPL
    fireEvent.click(screen.getByLabelText("Rimuovi AAPL"));

    // AAPL should be gone
    await waitFor(() => {
      expect(screen.queryByText("AAPL")).toBeNull();
    });

    // MSFT should still be there
    expect(screen.getByText("MSFT")).toBeDefined();
  });

  it("shows empty state after removing last item", async () => {
    const singleItemWatchlist = {
      watchlist: {
        id: "wl-1",
        name: "La mia Watchlist",
        items: [
          {
            id: "item-1",
            sortOrder: 0,
            symbol: { ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
          },
        ],
      },
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(singleItemWatchlist),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<WatchlistPanel />);

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText("Rimuovi AAPL"));

    await waitFor(() => {
      expect(
        screen.getByText("La tua watchlist è vuota. Inizia aggiungendo dei titoli!")
      ).toBeDefined();
    });
  });

  it("shows error state on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    render(<WatchlistPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Errore nel caricamento della watchlist")
      ).toBeDefined();
    });
  });

  it("displays quote data with price, change, and timestamp", async () => {
    mockQuotesData = {
      AAPL: {
        symbol: "AAPL",
        name: "Apple Inc",
        exchange: "NASDAQ",
        price: 182.52,
        change: 3.14,
        changePercent: 1.75,
        high: 184.0,
        low: 179.5,
        volume: 54321000,
        timestamp: new Date().toISOString(),
      },
      MSFT: {
        symbol: "MSFT",
        name: "Microsoft Corporation",
        exchange: "NASDAQ",
        price: 415.20,
        change: -2.30,
        changePercent: -0.55,
        high: 418.0,
        low: 413.0,
        volume: 12345000,
        timestamp: new Date().toISOString(),
      },
    };

    vi.stubGlobal("fetch", mockFetchWatchlist(MOCK_WATCHLIST));

    render(<WatchlistPanel />);

    await waitFor(() => {
      expect(screen.getByText("182.52")).toBeDefined();
      expect(screen.getByText("415.20")).toBeDefined();
    });

    expect(screen.getByText("+3.14")).toBeDefined();
    expect(screen.getByText("(+1.75%)")).toBeDefined();
    expect(screen.getByText("-2.30")).toBeDefined();
    expect(screen.getByText("(-0.55%)")).toBeDefined();
  });

  it("shows green color for positive change and red for negative", async () => {
    mockQuotesData = {
      AAPL: {
        symbol: "AAPL",
        name: "Apple Inc",
        exchange: "NASDAQ",
        price: 182.52,
        change: 3.14,
        changePercent: 1.75,
        high: null,
        low: null,
        volume: null,
        timestamp: new Date().toISOString(),
      },
      MSFT: {
        symbol: "MSFT",
        name: "Microsoft Corporation",
        exchange: "NASDAQ",
        price: 415.20,
        change: -2.30,
        changePercent: -0.55,
        high: null,
        low: null,
        volume: null,
        timestamp: new Date().toISOString(),
      },
    };

    vi.stubGlobal("fetch", mockFetchWatchlist(MOCK_WATCHLIST));

    render(<WatchlistPanel />);

    await waitFor(() => {
      const positiveChange = screen.getByText("+3.14");
      expect(positiveChange.className).toContain("text-green");

      const negativeChange = screen.getByText("-2.30");
      expect(negativeChange.className).toContain("text-red");
    });
  });
});
