export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }

  return request.headers.get("x-real-ip") ?? undefined;
}

function firstHeaderValue(value: string | null): string | undefined {
  if (!value) return undefined;

  const first = value.split(",")[0]?.trim();
  return first || undefined;
}

function isLocalIp(ip: string): boolean {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("127.") ||
    ip.startsWith("::ffff:127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

export function getClientLocation(request: Request): string {
  const city = firstHeaderValue(request.headers.get("x-vercel-ip-city"));
  const region = firstHeaderValue(request.headers.get("x-vercel-ip-country-region"));
  const country =
    firstHeaderValue(request.headers.get("x-vercel-ip-country")) ||
    firstHeaderValue(request.headers.get("cf-ipcountry")) ||
    firstHeaderValue(request.headers.get("x-country-code"));

  const location = [city, region, country].filter(Boolean).join(", ");
  if (location) return location;

  const ip = getClientIp(request);
  if (!ip) return "unknown";
  if (isLocalIp(ip)) return "local-network";

  return `ip:${ip}`;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}
