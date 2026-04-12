import { NextResponse, type NextRequest } from "next/server";

/**
 * HTTP Basic Auth via the Next.js 16 proxy (renamed from middleware).
 * Uses the SITE_PASSWORD env var — if unset, auth is disabled (local dev).
 *
 * The browser shows a native username/password prompt the first time;
 * credentials are then cached by the browser for the session.
 */
export function proxy(req: NextRequest) {
  const expected = process.env.SITE_PASSWORD;

  // No password set → skip auth (local dev, or deliberately disabled)
  if (!expected) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const encoded = auth.slice(6);
      const decoded = atob(encoded);
      const sep = decoded.indexOf(":");
      const password = sep >= 0 ? decoded.slice(sep + 1) : decoded;
      if (password === expected) {
        return NextResponse.next();
      }
    } catch {
      // fall through to challenge
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Wandersail", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

// Protect everything except static assets and the PWA manifest
// (manifest needs to be reachable without auth for Add to Home Screen).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js|woff|woff2|ttf|otf)).*)",
  ],
};
