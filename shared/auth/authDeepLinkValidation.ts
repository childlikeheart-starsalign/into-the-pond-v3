export function normalizeFirebaseAuthHost(domain: string): string {
  return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

type AuthDeepLinkAllowOptions = {
  authDomain?: string;
  appScheme?: string;
};

/**
 * Rejects auth action URLs from unknown hosts/schemes before routing oobCode handlers.
 * HTTPS links must match configured firebaseAuthDomain; custom scheme must match app scheme.
 */
export function isAllowedAuthDeepLinkUrl(
  rawUrl: string,
  options: AuthDeepLinkAllowOptions,
): boolean {
  const authDomainRaw = normalizeFirebaseAuthHost(options.authDomain ?? "");
  const appScheme = options.appScheme ?? "intothepond";

  if (/^https?:\/\//i.test(rawUrl)) {
    if (!authDomainRaw) return false;
    try {
      return new URL(rawUrl).host === authDomainRaw;
    } catch {
      return false;
    }
  }

  const schemeMatch = rawUrl.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  const scheme = schemeMatch?.[1]?.toLowerCase() ?? "";
  return scheme === appScheme.toLowerCase();
}
