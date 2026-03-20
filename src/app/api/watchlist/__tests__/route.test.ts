import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetUser, mockFindUnique, mockFindFirst, mockCreate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    watchlist: { findFirst: mockFindFirst, create: mockCreate },
  },
}));

import { GET } from "../route";

describe("GET /api/watchlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET(new NextRequest("http://localhost/api/watchlist"));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns watchlist with items for authenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });

    const mockWatchlist = {
      id: "wl-1",
      name: "La mia Watchlist",
      items: [
        {
          id: "item-1",
          sortOrder: 0,
          symbol: { ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
        },
      ],
    };
    mockFindFirst.mockResolvedValue(mockWatchlist);

    const response = await GET(new NextRequest("http://localhost/api/watchlist"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.watchlist).toEqual({
      id: "wl-1",
      name: "La mia Watchlist",
      items: [
        {
          id: "item-1",
          sortOrder: 0,
          symbol: { ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
        },
      ],
    });
  });

  it("auto-creates watchlist when user has none", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });
    mockFindFirst.mockResolvedValue(null);

    const createdWatchlist = {
      id: "wl-new",
      name: "La mia Watchlist",
      items: [],
    };
    mockCreate.mockResolvedValue(createdWatchlist);

    const response = await GET(new NextRequest("http://localhost/api/watchlist"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.watchlist).toEqual({
      id: "wl-new",
      name: "La mia Watchlist",
      items: [],
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "La mia Watchlist", userId: "user-1" },
      })
    );
  });
});
