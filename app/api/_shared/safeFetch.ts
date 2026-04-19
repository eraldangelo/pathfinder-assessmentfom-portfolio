type FetchInitWithUrl = RequestInit & { url: string };

const normalizeHost = (value: string): string => value.trim().toLowerCase();

const isHttps = (url: URL) => url.protocol === 'https:';

export const isAllowedOutboundUrl = (urlValue: string, allowedHosts: string[]): boolean => {
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    return false;
  }
  if (!isHttps(url)) return false;

  const host = normalizeHost(url.hostname);
  const allowed = allowedHosts.map(normalizeHost);
  return allowed.includes(host);
};

export const assertAllowedOutboundUrl = (urlValue: string, allowedHosts: string[]) => {
  if (!isAllowedOutboundUrl(urlValue, allowedHosts)) {
    throw new Error(`Blocked outbound request host for URL: ${urlValue}`);
  }
};

export const safeFetch = (options: FetchInitWithUrl, allowedHosts: string[]) => {
  assertAllowedOutboundUrl(options.url, allowedHosts);
  const { url, ...rest } = options;
  return fetch(url, rest);
};
