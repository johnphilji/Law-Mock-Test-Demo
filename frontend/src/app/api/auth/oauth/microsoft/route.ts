import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generatePkcePair, generateOAuthState, MICROSOFT_OAUTH_CONFIG } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const clientId = process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/oauth/microsoft/callback`;

  if (!clientId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "Microsoft sign-in is not configured yet. Please use email or phone.");
    return NextResponse.redirect(loginUrl);
  }

  const state = generateOAuthState();
  const { verifier, challenge } = generatePkcePair();

  const cookieStore = await cookies();
  cookieStore.set("oauth_ms_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  cookieStore.set("oauth_ms_verifier", verifier, {
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
    scope: MICROSOFT_OAUTH_CONFIG.scopes.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    response_mode: "query",
  });

  return NextResponse.redirect(`${MICROSOFT_OAUTH_CONFIG.authUrl}?${params.toString()}`);
}
