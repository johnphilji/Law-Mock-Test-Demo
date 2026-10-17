import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { signSessionToken, setSessionCookie, getCurrentSession } from "@/lib/session";
import { GOOGLE_OAUTH_CONFIG } from "@/lib/auth/oauth";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (errorParam) {
    logger.warn({ error: errorParam }, "Google OAuth callback error");
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", "Sign in with Google was cancelled or failed.");
    return NextResponse.redirect(loginUrl);
  }

  const savedState = cookieStore.get("oauth_google_state")?.value;
  const verifier = cookieStore.get("oauth_google_verifier")?.value;

  // Clear state and verifier cookies
  cookieStore.delete("oauth_google_state");
  cookieStore.delete("oauth_google_verifier");

  if (!state || !savedState || state !== savedState || !code || !verifier) {
    logger.error("Invalid state or verifier in Google OAuth callback");
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", "Security verification failed. Please try again.");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/oauth/google/callback`;

  if (!clientId || !clientSecret) {
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", "Google credentials are missing in server configuration.");
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Failed to exchange authorization code");
    }

    // 2. Fetch verified userinfo
    const userRes = await fetch(GOOGLE_OAUTH_CONFIG.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();

    if (!userRes.ok || !profile.sub || !profile.email) {
      throw new Error("Unable to retrieve Google user profile");
    }

    // Ensure email is verified by Google
    if (profile.email_verified === false) {
      const loginUrl = new URL("/login", appUrl);
      loginUrl.searchParams.set("error", "Your Google email address is not verified.");
      return NextResponse.redirect(loginUrl);
    }

    const providerAccountId = profile.sub;
    const normalizedEmail = String(profile.email).toLowerCase().trim();
    const name = profile.name || profile.given_name || "Student";

    // 3. Find if account is already linked
    let account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId,
        },
      },
      include: { user: true },
    });

    let targetUserId = "";
    let userRole: "STUDENT" | "ADMIN" = "STUDENT";
    let userName = name;

    const currentSession = await getCurrentSession();

    if (account) {
      // Existing linked account: Sign in
      targetUserId = account.userId;
      userRole = account.user.role as "STUDENT" | "ADMIN";
      userName = account.user.name;

      if (!account.user.isActive) {
        const loginUrl = new URL("/login", appUrl);
        loginUrl.searchParams.set("error", "This account has been deactivated.");
        return NextResponse.redirect(loginUrl);
      }
    } else if (currentSession) {
      // User is already logged in and linking Google to their account
      targetUserId = currentSession.id;
      userRole = currentSession.role;
      userName = currentSession.name;

      await prisma.account.create({
        data: {
          userId: targetUserId,
          type: "oauth",
          provider: "google",
          providerAccountId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: tokenData.expires_in ? Math.floor(Date.now() / 1000) + tokenData.expires_in : null,
          token_type: tokenData.token_type || "Bearer",
          scope: tokenData.scope || null,
          id_token: tokenData.id_token || null,
        },
      });
      // Redirect to account settings
      return NextResponse.redirect(new URL("/dashboard?linked=google", appUrl));
    } else {
      // Check if user exists with matching verified email
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        // Link to existing user safely because Google guarantees verified email
        targetUserId = existingUser.id;
        userRole = existingUser.role as "STUDENT" | "ADMIN";
        userName = existingUser.name;

        // Auto-mark email as verified
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { isEmailVerified: true },
        });

        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: "oauth",
            provider: "google",
            providerAccountId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            expires_at: tokenData.expires_in ? Math.floor(Date.now() / 1000) + tokenData.expires_in : null,
            token_type: tokenData.token_type || "Bearer",
            scope: tokenData.scope || null,
            id_token: tokenData.id_token || null,
          },
        });
      } else {
        // Create new user (ALWAYS STUDENT, never ADMIN)
        const newUser = await prisma.user.create({
          data: {
            name,
            email: normalizedEmail,
            role: "STUDENT",
            isEmailVerified: true,
            isActive: true,
          },
        });

        targetUserId = newUser.id;
        userRole = "STUDENT";
        userName = newUser.name;

        await prisma.account.create({
          data: {
            userId: newUser.id,
            type: "oauth",
            provider: "google",
            providerAccountId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            expires_at: tokenData.expires_in ? Math.floor(Date.now() / 1000) + tokenData.expires_in : null,
            token_type: tokenData.token_type || "Bearer",
            scope: tokenData.scope || null,
            id_token: tokenData.id_token || null,
          },
        });
      }
    }

    // 4. Issue authenticated session
    const token = await signSessionToken({
      id: targetUserId,
      email: normalizedEmail,
      name: userName,
      role: userRole,
    });
    await setSessionCookie(token);

    logger.info({ userId: targetUserId, provider: "google" }, "Google OAuth login successful");

    const destination = userRole === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(destination, appUrl));
  } catch (err: any) {
    logger.error({ error: err.message }, "Google callback processing failed");
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", "Failed to complete Google sign-in. Please try again.");
    return NextResponse.redirect(loginUrl);
  }
}
