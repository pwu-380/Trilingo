const TOKEN_KEY = "trilingo_token";

function getToken(): string | null {
  // Check URL params first (initial page load), then localStorage
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");
  if (urlToken) {
    localStorage.setItem(TOKEN_KEY, urlToken);
    return urlToken;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export async function checkAuth(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  const res = await fetch("/api/auth/check", {
    headers: { "x-trilingo-token": token },
  });
  return res.ok;
}

export function authedUrl(path: string): string {
  const token = getToken();
  return token ? `${path}?token=${encodeURIComponent(token)}` : path;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["x-trilingo-token"] = token;
  }

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
