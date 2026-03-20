import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetUser,
  mockUserFindUnique,
  mockAlertFindMany,
  mockAlertUpdate,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockAlertFindMany: vi.fn(),
  mockAlertUpdate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    alert: { findMany: mockAlertFindMany, update: mockAlertUpdate },
  },
}));

vi.mock("@/lib/email/resend", () => ({
  sendAlertNotification: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "../route";

describe("POST /api/alerts/evaluate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest("http://localhost/api/alerts/evaluate", {
      method: "POST",
      body: JSON.stringify({ quotes: { AAPL: { price: 155 } } }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("triggers 'above' alert when price >= threshold", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockUserFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });

    mockAlertFindMany.mockResolvedValue([
      {
        id: "alert-1",
        direction: "above",
        threshold: 150,
        status: "active",
        symbol: { id: "sym-1", ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
      },
    ]);

    const triggeredDate = new Date();
    mockAlertUpdate.mockResolvedValue({
      id: "alert-1",
      direction: "above",
      threshold: 150,
      status: "triggered",
      triggeredAt: triggeredDate,
      triggeredPrice: 155,
      symbol: { id: "sym-1", ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
    });

    const request = new NextRequest("http://localhost/api/alerts/evaluate", {
      method: "POST",
      body: JSON.stringify({ quotes: { AAPL: { price: 155 } } }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.triggered).toHaveLength(1);
    expect(body.triggered[0].id).toBe("alert-1");
    expect(body.triggered[0].status).toBe("triggered");
    expect(body.triggered[0].triggeredPrice).toBe(155);
    expect(mockAlertUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "alert-1" },
        data: expect.objectContaining({
          status: "triggered",
          triggeredPrice: 155,
        }),
      })
    );
  });

  it("triggers 'below' alert when price <= threshold", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockUserFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });

    mockAlertFindMany.mockResolvedValue([
      {
        id: "alert-2",
        direction: "below",
        threshold: 100,
        status: "active",
        symbol: { id: "sym-1", ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
      },
    ]);

    mockAlertUpdate.mockResolvedValue({
      id: "alert-2",
      direction: "below",
      threshold: 100,
      status: "triggered",
      triggeredAt: new Date(),
      triggeredPrice: 95,
      symbol: { id: "sym-1", ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
    });

    const request = new NextRequest("http://localhost/api/alerts/evaluate", {
      method: "POST",
      body: JSON.stringify({ quotes: { AAPL: { price: 95 } } }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.triggered).toHaveLength(1);
    expect(body.triggered[0].id).toBe("alert-2");
    expect(body.triggered[0].status).toBe("triggered");
    expect(body.triggered[0].triggeredPrice).toBe(95);
  });

  it("does not trigger when condition is not met", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockUserFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });

    mockAlertFindMany.mockResolvedValue([
      {
        id: "alert-1",
        direction: "above",
        threshold: 200,
        status: "active",
        symbol: { id: "sym-1", ticker: "AAPL", name: "Apple Inc", exchange: "NASDAQ" },
      },
    ]);

    const request = new NextRequest("http://localhost/api/alerts/evaluate", {
      method: "POST",
      body: JSON.stringify({ quotes: { AAPL: { price: 150 } } }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.triggered).toHaveLength(0);
    expect(mockAlertUpdate).not.toHaveBeenCalled();
  });

  it("skips already triggered alerts (only active alerts are fetched)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockUserFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });

    // The route filters by status: "active", so already triggered alerts
    // are not returned by findMany
    mockAlertFindMany.mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/alerts/evaluate", {
      method: "POST",
      body: JSON.stringify({ quotes: { AAPL: { price: 155 } } }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.triggered).toHaveLength(0);
    expect(mockAlertFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "active",
        }),
      })
    );
    expect(mockAlertUpdate).not.toHaveBeenCalled();
  });
});
