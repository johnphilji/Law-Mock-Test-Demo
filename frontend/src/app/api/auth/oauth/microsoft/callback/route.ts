import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { signSessionToken, setSessionCookie, getCurrentSession } from "@/lib/session";
import { MICROSOFT_OAUTH_CONFIG } from "@/lib/auth/oauth";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (errorParam) {
    logger.warn({ error: errorParam, desc: errorDesc }, "Microsoft OAuth callback error");
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", "Sign in with Microsoft was cancelled or failed.");
    return NextResponse.redirect(loginUrl);
  }

  const savedState = cookieStore.get("oauth_ms_state")?.value;
  const verifier = cookieStore.get("oauth_ms_verifier")?.value;

  cookieStore.delete("oauth_ms_state");
  cookieStore.delete("oauth_ms_verifier");

  if (!state || !savedState || state !== savedState || !code || !verifier) {
    logger.error("Invalid state or verifier in Microsoft OAuth callback");
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", "Security verification failed. Please try again.");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/oauth/microsoft/callback`;

  if (!clientId || !clientSecret) {
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", "Microsoft credentials are missing in server configuration.");
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch(MICROSOFT_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Failed to exchange Microsoft authorization code");
    }

    // 2. Fetch user profile from Microsoft Graph OIDC endpoint
    const userRes = await fetch(MICROSOFT_OAUTH_CONFIG.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userRes.json();

    if (!userRes.ok || !profile.sub) {
      throw new Error("Unable to retrieve Microsoft user profile");
    }

    const providerAccountId = profile.sub;
    const rawEmail = profile.email || profile.preferred_username || profile.upn;
    if (!rawEmail || !rawEmail.includes("@")) {
      throw new Error("Microsoft account does not have an accessible email address");
    }

    const normalizedEmail = String(rawEmail).toLowerCase().trim();
    const name = profile.name || profile.given_name || "Student";

    // 3. Find if account is already linked
    let account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "azure-ad",
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
      targetUserId = account.userId;
      userRole = account.user.role as "STUDENT" | "ADMIN";
      userName = account.user.name;

      if (!account.user.isActive) {
        const loginUrl = new URL("/login", appUrl);
        loginUrl.searchParams.set("error", "This account has been deactivated.");
        return NextResponse.redirect(loginUrl);
      }
    } else if (currentSession) {
      targetUserId = currentSession.id;
      userRole = currentSession.role;
      userName = currentSession.name;

      await prisma.account.create({
        data: {
          userId: targetUserId,
          type: "oauth",
          provider: "azure-ad",
          providerAccountId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: tokenData.expires_in ? Math.floor(Date.now() / 1000) + tokenData.expires_in : null,
          token_type: tokenData.token_type || "Bearer",
          scope: tokenData.scope || null,
          id_token: tokenData.id_token || null,
        },
      });
      return NextResponse.redirect(new URL("/dashboard?linked=microsoft", appUrl));
    } else {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        targetUserId = existingUser.id;
        userRole = existingUser.role as "STUDENT" | "ADMIN";
        userName = existingUser.name;

        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: "oauth",
            provider: "azure-ad",
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
            provider: "azure-ad",
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

    const token = await signSessionToken({
      id: targetUserId,
      email: normalizedEmail,
      name: userName,
      role: userRole,
    });
    await setSessionCookie(token);

    logger.info({ userId: targetUserId, provider: "azure-ad" }, "Microsoft OAuth login successful");

    const destination = userRole === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(destination, appUrl));
  } catch (err: any) {
    logger.error({ error: err.message }, "Microsoft callback processing failed");
    const loginUrl = new URL("/login", appUrl);
    loginUrl.searchParams.set("error", "Failed to complete Microsoft sign-in. Please try again.");
    return NextResponse.redirect(loginUrl);
  }
}
