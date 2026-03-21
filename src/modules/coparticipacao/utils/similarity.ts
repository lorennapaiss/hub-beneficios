const levenshteinDistance = (a: string, b: string) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );

  for (let index = 0; index <= a.length; index += 1) {
    matrix[index][0] = index;
  }

  for (let index = 0; index <= b.length; index += 1) {
    matrix[0][index] = index;
  }

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
};

const tokenSimilarity = (a: string, b: string) => {
  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));

  if (aTokens.size === 0 && bTokens.size === 0) return 1;

  let intersection = 0;
  aTokens.forEach((token) => {
    if (bTokens.has(token)) intersection += 1;
  });

  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : intersection / union;
};

export const computeSimilarity = (a: string, b: string) => {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const levenshtein =
    1 - levenshteinDistance(a, b) / Math.max(a.length, b.length, 1);
  const jaccard = tokenSimilarity(a, b);

  return Number(((levenshtein * 0.65) + jaccard * 0.35).toFixed(4));
};
