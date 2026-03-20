import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetUser,
  mockUserFindUnique,
  mockAlertFindUnique,
  mockAlertUpdate,
  mockAlertDelete,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockAlertFindUnique: vi.fn(),
  mockAlertUpdate: vi.fn(),
  mockAlertDelete: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    alert: {
      findUnique: mockAlertFindUnique,
      update: mockAlertUpdate,
      delete: mockAlertDelete,
    },
  },
}));

import { PATCH, DELETE } from "../route";

describe("PATCH /api/alerts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest("http://localhost/api/alerts/alert-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "disabled" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "alert-1" }),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when alert is not owned by user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockUserFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });
    mockAlertFindUnique.mockResolvedValue({
      id: "alert-1",
      userId: "user-other",
    });

    const request = new NextRequest("http://localhost/api/alerts/alert-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "disabled" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "alert-1" }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Not found");
  });

  it("returns 200 and updates alert status", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockUserFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });
    mockAlertFindUnique.mockResolvedValue({
      id: "alert-1",
      userId: "user-1",
    });
    mockAlertUpdate.mockResolvedValue({
      id: "alert-1",
      direction: "above",
      threshold: 150,
      status: "disabled",
      triggeredAt: null,
      triggeredPrice: null,
      symbol: {
        id: "sym-1",
        ticker: "AAPL",
        name: "Apple Inc",
        exchange: "NASDAQ",
      },
    });

    const request = new NextRequest("http://localhost/api/alerts/alert-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "disabled" }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: "alert-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.alert.status).toBe("disabled");
    expect(body.alert.id).toBe("alert-1");
  });
});

describe("DELETE /api/alerts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest("http://localhost/api/alerts/alert-1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "alert-1" }),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 and deletes the alert", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "supabase-123" } },
    });
    mockUserFindUnique.mockResolvedValue({ id: "user-1", supabaseId: "supabase-123" });
    mockAlertFindUnique.mockResolvedValue({
      id: "alert-1",
      userId: "user-1",
    });
    mockAlertDelete.mockResolvedValue({});

    const request = new NextRequest("http://localhost/api/alerts/alert-1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "alert-1" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockAlertDelete).toHaveBeenCalledWith({ where: { id: "alert-1" } });
  });
});
