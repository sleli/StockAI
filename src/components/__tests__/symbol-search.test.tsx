import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SymbolSearch } from "../symbol-search";

// Mock @base-ui/react/input to render a plain <input> so jsdom can handle it
vi.mock("@base-ui/react/input", () => ({
  Input: (props: React.ComponentProps<"input">) => <input {...props} />,
}));

const MOCK_RESULTS = [
  {
    symbol: "AAPL",
    name: "Apple Inc",
    exchange: "NASDAQ",
    type: "Common Stock",
    country: "United States",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    exchange: "NASDAQ",
    type: "Common Stock",
    country: "United States",
  },
];

function mockFetchSuccess(results = MOCK_RESULTS) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ results }),
  });
}

function mockFetchError(message = "Rate limit exceeded") {
  return vi.fn().mockResolvedValue({
    ok: false,
    json: vi.fn().mockResolvedValue({ error: message }),
  });
}

function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new Error("Network failure"));
}

describe("SymbolSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders input with placeholder and no results initially", () => {
    render(<SymbolSearch />);
    expect(
      screen.getByPlaceholderText("Cerca per ticker o nome...")
    ).toBeDefined();
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByText("Nessun titolo trovato")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("does not fetch before debounce timeout", () => {
    const fetchMock = mockFetchSuccess();
    vi.stubGlobal("fetch", fetchMock);

    render(<SymbolSearch />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "AAPL" } });
    vi.advanceTimersByTime(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches after debounce timeout", () => {
    const fetchMock = mockFetchSuccess();
    vi.stubGlobal("fetch", fetchMock);

    render(<SymbolSearch />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "AAPL" } });
    vi.advanceTimersByTime(300);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/search?q=AAPL");
  });

  it("resets debounce on consecutive keystrokes", () => {
    const fetchMock = mockFetchSuccess();
    vi.stubGlobal("fetch", fetchMock);

    render(<SymbolSearch />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "A" } });
    vi.advanceTimersByTime(200);
    fireEvent.change(input, { target: { value: "AA" } });
    vi.advanceTimersByTime(200);

    expect(fetchMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/search?q=AA");
  });

  it("displays search results with ticker, name, and exchange", async () => {
    const fetchMock = mockFetchSuccess();
    vi.stubGlobal("fetch", fetchMock);

    render(<SymbolSearch />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "AAPL" } });

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Switch to real timers for waitFor
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeDefined();
      expect(screen.getByText("Apple Inc")).toBeDefined();
      expect(screen.getAllByText("NASDAQ")).toHaveLength(2);
    });
  });

  it("shows 'Nessun titolo trovato' for empty results", async () => {
    const fetchMock = mockFetchSuccess([]);
    vi.stubGlobal("fetch", fetchMock);

    render(<SymbolSearch />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "ZZZXXX" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText("Nessun titolo trovato")).toBeDefined();
    });
  });

  it("shows error message on fetch failure", async () => {
    const fetchMock = mockFetchError("Rate limit exceeded");
    vi.stubGlobal("fetch", fetchMock);

    render(<SymbolSearch />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText("Rate limit exceeded")).toBeDefined();
    });
  });

  it("calls onSelect when a result is clicked", async () => {
    const fetchMock = mockFetchSuccess();
    vi.stubGlobal("fetch", fetchMock);
    const onSelect = vi.fn();

    render(<SymbolSearch onSelect={onSelect} />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText("Apple Inc")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Apple Inc"));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(MOCK_RESULTS[0]);
  });

  it("shows error message when fetch throws a network error", async () => {
    const fetchMock = mockFetchNetworkError();
    vi.stubGlobal("fetch", fetchMock);

    render(<SymbolSearch />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toBe("Network failure");
    });
  });

  it("does not fetch when input is cleared", () => {
    const fetchMock = mockFetchSuccess();
    vi.stubGlobal("fetch", fetchMock);

    render(<SymbolSearch />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "AAPL" } });
    fireEvent.change(input, { target: { value: "" } });
    vi.advanceTimersByTime(300);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows loading indicator while fetch is pending", async () => {
    let resolveFetch!: (value: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      )
    );

    render(<SymbolSearch />);
    const input = screen.getByPlaceholderText("Cerca per ticker o nome...");

    fireEvent.change(input, { target: { value: "AAPL" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Loading should be visible while fetch is pending
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("Ricerca in corso...")).toBeDefined();

    // Resolve the fetch and switch to real timers
    vi.useRealTimers();

    await act(async () => {
      resolveFetch({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });
    });

    // Loading should disappear
    await waitFor(() => {
      expect(screen.queryByRole("status")).toBeNull();
    });
  });
});
