import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetUser,
  mockFindUnique,
  mockAlertFindMany,
  mockAlertCreate,
  mockSymbolFindUnique,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFindUnique: vi.fn(),
  mockAlertFindMany: vi.fn(),
  mockAlertCreate: vi.fn(),
  mockSymbolFindUnique: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
    alert: { findMany: mockAlertFindMany, create: mockAlertCreate },
    symbol: { findUnique: mockSymbolFindUnique },
  },
}));

import { GET, POST } from "../route";

describe("GET /api/alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with alerts list for authenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });

    const mockAlerts = [
      {
        id: "alert-1",
        direction: "above",
        threshold: 150,
        status: "active",
        triggeredAt: null,
        triggeredPrice: null,
        symbol: {
          id: "sym-1",
          ticker: "AAPL",
          name: "Apple Inc",
          exchange: "NASDAQ",
        },
      },
    ];
    mockAlertFindMany.mockResolvedValue(mockAlerts);

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.alerts).toEqual([
      {
        id: "alert-1",
        direction: "above",
        threshold: 150,
        status: "active",
        triggeredAt: null,
        triggeredPrice: null,
        symbol: {
          id: "sym-1",
          ticker: "AAPL",
          name: "Apple Inc",
          exchange: "NASDAQ",
        },
      },
    ]);
  });
});

describe("POST /api/alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest("http://localhost/api/alerts", {
      method: "POST",
      body: JSON.stringify({
        symbolId: "sym-1",
        direction: "above",
        threshold: 150,
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when required fields are missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });

    const request = new NextRequest("http://localhost/api/alerts", {
      method: "POST",
      body: JSON.stringify({ symbolId: "sym-1" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 when direction is invalid", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });

    const request = new NextRequest("http://localhost/api/alerts", {
      method: "POST",
      body: JSON.stringify({
        symbolId: "sym-1",
        direction: "sideways",
        threshold: 150,
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Direction must be 'above' or 'below'");
  });

  it("returns 201 when alert is created successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });
    mockSymbolFindUnique.mockResolvedValue({
      id: "sym-1",
      ticker: "AAPL",
      name: "Apple Inc",
      exchange: "NASDAQ",
    });
    mockAlertCreate.mockResolvedValue({
      id: "alert-1",
      direction: "above",
      threshold: 150,
      status: "active",
      triggeredAt: null,
      triggeredPrice: null,
      symbol: {
        id: "sym-1",
        ticker: "AAPL",
        name: "Apple Inc",
        exchange: "NASDAQ",
      },
    });

    const request = new NextRequest("http://localhost/api/alerts", {
      method: "POST",
      body: JSON.stringify({
        symbolId: "sym-1",
        direction: "above",
        threshold: 150,
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.alert).toEqual({
      id: "alert-1",
      direction: "above",
      threshold: 150,
      status: "active",
      triggeredAt: null,
      triggeredPrice: null,
      symbol: {
        id: "sym-1",
        ticker: "AAPL",
        name: "Apple Inc",
        exchange: "NASDAQ",
      },
    });
  });
});
