const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/** Ubah URL MinIO absolut menjadi path proxy /media agar tidak terikat host localhost:9000 */
export function mediaUrl(url: string): string {
  if (!url) return url;
  const match = url.match(/^https?:\/\/[^/]+\/(.+)$/);
  return match ? `/media/${match[1]}` : url;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  specs: Record<string, unknown>;
  createdAt?: string;
}

export interface ProductListResponse {
  data: Product[];
  meta: { total: number; page: number; limit: number };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("katalis_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message)
        ? body.message.join(", ")
        : body.message || message;
    } catch {
      /* body bukan JSON */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ id: string; name: string; email: string; role: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ name, email, password }) },
    ),

  // Products
  listProducts: (params: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    return request<ProductListResponse>(`/products?${qs.toString()}`);
  },
  getProduct: (id: string) => request<Product>(`/products/${id}`),
  createProduct: (form: FormData) =>
    request<Product>("/products", { method: "POST", body: form }),
  updateProduct: (id: string, form: FormData) =>
    request<Product>(`/products/${id}`, { method: "PATCH", body: form }),
  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/products/${id}`, { method: "DELETE" }),

  // AI
  chatProduct: (id: string, message: string) =>
    request<{ success: boolean; productId: string; reply: string }>(
      `/products/${id}/chat`,
      { method: "POST", body: JSON.stringify({ message }) },
    ),
  aiSearch: (query: string) =>
    request<{ success: boolean; reply: string; products: Product[] }>(
      "/ai/search",
      { method: "POST", body: JSON.stringify({ query }) },
    ),
};

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
