import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import * as oidc from "openid-client";
import {
  clearSession,
  createSession,
  deleteSession,
  getOidcConfig,
  getSessionId,
  ISSUER_URL,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();
const OIDC_COOKIE_TTL = 10 * 60 * 1000;

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}`;
}

function safeReturnTo(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: SESSION_TTL });
}

function setFlowCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: OIDC_COOKIE_TTL });
}

function getErrorMetadata(error: unknown) {
  return { errorName: error instanceof Error ? error.name : typeof error };
}

async function upsertUser(claims: Record<string, unknown>) {
  const userData = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as string | null,
  };
  const [user] = await db.insert(usersTable).values(userData).onConflictDoUpdate({
    target: usersTable.id,
    set: { ...userData, updatedAt: new Date() },
  }).returning();
  return user;
}

router.get("/auth/user", (req, res) => {
  res.json(GetCurrentAuthUserResponse.parse({ user: req.isAuthenticated() ? req.user : null }));
});

router.get("/login", async (req, res) => {
  try {
    const config = await getOidcConfig();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const redirectTo = oidc.buildAuthorizationUrl(config, {
      redirect_uri: `${getOrigin(req)}/api/callback`,
      scope: "openid profile email",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    });
    setFlowCookie(res, "oidc_state", state);
    setFlowCookie(res, "oidc_nonce", nonce);
    setFlowCookie(res, "oidc_verifier", codeVerifier);
    setFlowCookie(res, "oidc_return_to", safeReturnTo(req.query.returnTo));
    res.redirect(redirectTo.href);
  } catch (error) {
    req.log.error(getErrorMetadata(error), "Login start failed");
    res.status(500).send("Unable to start login");
  }
});

router.get("/callback", async (req, res) => {
  const returnTo = safeReturnTo(req.cookies?.oidc_return_to);
  try {
    const config = await getOidcConfig();
    const callbackUrl = new URL(`${getOrigin(req)}/api/callback`);
    for (const key of ["code", "state", "iss"]) {
      const value = req.query[key];
      if (typeof value === "string") callbackUrl.searchParams.set(key, value);
    }
    const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: req.cookies?.oidc_verifier,
      expectedState: req.cookies?.oidc_state,
      expectedNonce: req.cookies?.oidc_nonce,
      idTokenExpected: true,
    });
    const claims = tokens.claims();
    if (!claims?.sub) { res.status(401).send("Login did not return a user"); return; }
    const user = await upsertUser(claims as unknown as Record<string, unknown>);
    const now = Math.floor(Date.now() / 1000);
    const session: SessionData = {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
    };
    setSessionCookie(res, await createSession(session));
    for (const cookie of ["oidc_state", "oidc_nonce", "oidc_verifier", "oidc_return_to"]) res.clearCookie(cookie, { path: "/" });
    res.redirect(returnTo);
  } catch (error) {
    req.log.error(getErrorMetadata(error), "Login callback failed");
    res.redirect("/api/login");
  }
});

router.get("/logout", async (req, res) => {
  const config = await getOidcConfig();
  const returnTo = safeReturnTo(req.query.returnTo);
  const origin = getOrigin(req);
  await clearSession(res, getSessionId(req));
  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: new URL(returnTo, `${origin}/`).href,
  });
  res.redirect(endSessionUrl.href);
});

router.post("/mobile-auth/logout", async (req, res) => {
  const sid = getSessionId(req);
  if (sid) await deleteSession(sid);
  res.json({ success: true });
});

export default router;