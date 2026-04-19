const normalizeName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');

const getNameTokens = (value: string) => normalizeName(value).split(' ').filter(Boolean);

export const isSamePersonByName = (firstName: string, secondName: string) => {
  const normalizedFirst = normalizeName(firstName);
  const normalizedSecond = normalizeName(secondName);

  if (!normalizedFirst || !normalizedSecond) return false;
  if (normalizedFirst === normalizedSecond) return true;

  const firstTokens = new Set(getNameTokens(firstName));
  const secondTokens = new Set(getNameTokens(secondName));
  if (firstTokens.size === 0 || secondTokens.size === 0) return false;

  let overlappingTokens = 0;
  for (const token of firstTokens) {
    if (secondTokens.has(token)) {
      overlappingTokens += 1;
    }
  }

  const shortestNameTokenCount = Math.min(firstTokens.size, secondTokens.size);
  return overlappingTokens >= 2 && overlappingTokens === shortestNameTokenCount;
};

