import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generatePkcePair, generateOAuthState, GOOGLE_OAUTH_CONFIG } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/oauth/google/callback`;

  if (!clientId) {
    // If not configured, return safe informative error or redirect to login with query
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "Google sign-in is not configured yet. Please use email or phone.");
    return NextResponse.redirect(loginUrl);
  }

  const state = generateOAuthState();
  const { verifier, challenge } = generatePkcePair();

  const cookieStore = await cookies();
  cookieStore.set("oauth_google_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });
  cookieStore.set("oauth_google_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_CONFIG.scopes.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "select_account",
  });

  return NextResponse.redirect(`${GOOGLE_OAUTH_CONFIG.authUrl}?${params.toString()}`);
}
