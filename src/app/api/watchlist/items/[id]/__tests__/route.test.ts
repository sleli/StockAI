import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({
    auth: { getUser: mockGetUser },
  }),
}));

const mockFindUnique = vi.fn();
const mockFindUniqueItem = vi.fn();
const mockDelete = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: any[]) => mockFindUnique(...args) },
    watchlistItem: {
      findUnique: (...args: any[]) => mockFindUniqueItem(...args),
      delete: (...args: any[]) => mockDelete(...args),
    },
  },
}));

import { DELETE } from "../route";

const MOCK_USER = { id: "supabase-123" };
const MOCK_DB_USER = { id: "db-user-1", supabaseId: "supabase-123" };

describe("DELETE /api/watchlist/items/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest("http://localhost/api/watchlist/items/item-1", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "item-1" }) });

    expect(response.status).toBe(401);
  });

  it("returns 404 when item does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER } });
    mockFindUnique.mockResolvedValue(MOCK_DB_USER);
    mockFindUniqueItem.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/watchlist/items/nonexistent", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });

  it("returns 404 when item belongs to another user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER } });
    mockFindUnique.mockResolvedValue(MOCK_DB_USER);
    mockFindUniqueItem.mockResolvedValue({
      id: "item-1",
      watchlist: { userId: "other-user-id" },
    });

    const request = new NextRequest("http://localhost/api/watchlist/items/item-1", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "item-1" }) });

    expect(response.status).toBe(404);
  });

  it("returns 200 and deletes item successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER } });
    mockFindUnique.mockResolvedValue(MOCK_DB_USER);
    mockFindUniqueItem.mockResolvedValue({
      id: "item-1",
      watchlist: { userId: "db-user-1" },
    });
    mockDelete.mockResolvedValue({});

    const request = new NextRequest("http://localhost/api/watchlist/items/item-1", {
      method: "DELETE",
    });
    const response = await DELETE(request, { params: Promise.resolve({ id: "item-1" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "item-1" } });
  });
});
