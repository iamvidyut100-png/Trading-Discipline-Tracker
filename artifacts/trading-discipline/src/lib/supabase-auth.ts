const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "https://wcbkpwmlztkdafiucjni.supabase.co").replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_T1nh8kXAVGa2RQGbe56h1g_Tv1foc5t";
const SESSION_KEY = "trading-discipline.supabase-session";

export type SupabaseUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };
type StoredSession = { access_token: string; refresh_token?: string; expires_at?: number; user: SupabaseUser };
type AuthResponse = { access_token?: string; refresh_token?: string; expires_in?: number; user?: SupabaseUser; error_description?: string; msg?: string };

function requireConfig() {
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
}

function message(response: AuthResponse) {
  return response.error_description || response.msg || "Authentication could not be completed.";
}

function saveSession(response: AuthResponse) {
  if (!response.access_token || !response.user) return null;
  const session: StoredSession = {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    expires_at: response.expires_in ? Math.floor(Date.now() / 1000) + response.expires_in : undefined,
    user: response.user,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function currentSession() {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as StoredSession) : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

async function authFetch(path: string, init: RequestInit) {
  const { url, key } = requireConfig();
  return fetch(`${url}/auth/v1/${path}`, {
    ...init,
    headers: { apikey: key, "Content-Type": "application/json", ...init.headers },
  });
}

export async function restoreSession() {
  const session = currentSession();
  if (!session) return null;
  if (!session.expires_at || session.expires_at > Math.floor(Date.now() / 1000) + 30) return session.user;
  if (!session.refresh_token) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  const response = await authFetch("token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }) });
  const body = (await response.json()) as AuthResponse;
  if (!response.ok || !saveSession(body)) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return body.user ?? null;
}

export async function signUp(email: string, password: string) {
  const response = await authFetch("signup", {
    method: "POST",
    body: JSON.stringify({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } }),
  });
  const body = (await response.json()) as AuthResponse;
  if (!response.ok) throw new Error(message(body));
  return { user: body.user ?? null, session: saveSession(body) };
}

export async function signInWithPassword(email: string, password: string) {
  const response = await authFetch("token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  const body = (await response.json()) as AuthResponse;
  if (!response.ok || !saveSession(body)) throw new Error(message(body));
  return body.user!;
}

export function signInWithGoogle() {
  const { url, key } = requireConfig();
  const params = new URLSearchParams({ provider: "google", redirect_to: `${window.location.origin}/`, response_type: "token" });
  window.location.assign(`${url}/auth/v1/authorize?${params.toString()}&apikey=${encodeURIComponent(key)}`);
}

export function consumeOAuthCallback() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  if (!accessToken) return null;
  const user = params.get("user");
  let parsedUser: SupabaseUser | undefined;
  try { parsedUser = user ? (JSON.parse(user) as SupabaseUser) : undefined; } catch { /* User is fetched below when omitted. */ }
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  return { accessToken, refreshToken: params.get("refresh_token") ?? undefined, expiresIn: Number(params.get("expires_in") || 0), user: parsedUser };
}

export async function completeOAuthCallback() {
  const callback = consumeOAuthCallback();
  if (!callback) return null;
  let user = callback.user;
  if (!user) {
    const { url, key } = requireConfig();
    const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${callback.accessToken}` } });
    if (!response.ok) throw new Error("Could not restore your Google session.");
    user = (await response.json()) as SupabaseUser;
  }
  saveSession({ access_token: callback.accessToken, refresh_token: callback.refreshToken, expires_in: callback.expiresIn, user });
  return user;
}

export async function signOut() {
  const session = currentSession();
  try {
    if (session) await authFetch("logout", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
  } finally {
    localStorage.removeItem(SESSION_KEY);
  }
}
