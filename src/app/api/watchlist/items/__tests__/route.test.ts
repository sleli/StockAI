import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

const {
  mockGetUser,
  mockFindUnique,
  mockWatchlistFindFirst,
  mockWatchlistCreate,
  mockSymbolUpsert,
  mockWatchlistItemCreate,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFindUnique: vi.fn(),
  mockWatchlistFindFirst: vi.fn(),
  mockWatchlistCreate: vi.fn(),
  mockSymbolUpsert: vi.fn(),
  mockWatchlistItemCreate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    watchlist: { findFirst: mockWatchlistFindFirst, create: mockWatchlistCreate },
    symbol: { upsert: mockSymbolUpsert },
    watchlistItem: { create: mockWatchlistItemCreate },
  },
}));

import { POST } from "../route";

describe("POST /api/watchlist/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest("http://localhost/api/watchlist/items", {
      method: "POST",
      body: JSON.stringify({ ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when body is missing required fields", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });

    const request = new NextRequest("http://localhost/api/watchlist/items", {
      method: "POST",
      body: JSON.stringify({ ticker: "AAPL" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 201 when adding a new item", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });
    mockWatchlistFindFirst.mockResolvedValue({ id: "wl-1" });
    mockSymbolUpsert.mockResolvedValue({ id: "sym-1", ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" });
    mockWatchlistItemCreate.mockResolvedValue({
      id: "item-1",
      symbol: { ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
    });

    const request = new NextRequest("http://localhost/api/watchlist/items", {
      method: "POST",
      body: JSON.stringify({ ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.item).toEqual({
      id: "item-1",
      symbol: { ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
    });
  });

  it("returns 409 when adding a duplicate item", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });
    mockWatchlistFindFirst.mockResolvedValue({ id: "wl-1" });
    mockSymbolUpsert.mockResolvedValue({ id: "sym-1", ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" });
    mockWatchlistItemCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "5.0.0",
      })
    );

    const request = new NextRequest("http://localhost/api/watchlist/items", {
      method: "POST",
      body: JSON.stringify({ ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("Titolo già in watchlist");
  });
});
