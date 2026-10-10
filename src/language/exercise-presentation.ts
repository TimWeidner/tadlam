export type MatchPair = { left: string; right: string };

/** Returns a new Fisher-Yates permutation without changing the source array. */
export function shuffled<T>(
  values: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1));
    [result[index], result[otherIndex]] = [
      result[otherIndex],
      result[index],
    ];
  }

  return result;
}

/**
 * Randomizes both sides of a matching exercise independently. When chance
 * produces identical rows, rotate one side so the solution is never exposed.
 */
export function randomizedMatchPairs(
  pairs: readonly MatchPair[],
  random: () => number = Math.random,
): { left: MatchPair[]; right: MatchPair[] } {
  const left = shuffled(pairs, random);
  let right = shuffled(pairs, random);

  if (
    left.length > 1 &&
    left.every((pair, index) => pair.left === right[index]?.left)
  ) {
    right = [...right.slice(1), right[0]];
  }

  return { left, right };
}
