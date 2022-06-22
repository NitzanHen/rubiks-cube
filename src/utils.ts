
export type Axis = 'x' | 'y' | 'z';
export type Sign = 1 | -1;

export function* generatePermutations<T>(...iters: Iterable<T>[]): Generator<T[]> {
  if (iters.length === 0) {
    // no permutations
    yield [];
    return;
  }

  const [iter, ...rest] = iters;
  for (const x of iter) {
    for (const perm of generatePermutations(...rest)) {
      yield [x, ...perm];
    }
  }
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

/**
 * Generates a random integer in [min, max), that's different from 'excluded'.
 * excluded value is assumed to be in [min, max).
 */
export const randomIntExcluding = (min: number, max: number, excluded: number) => {
  const rand = randomInt(min, max - 1);

  // map 0, 1, ..., excluded, excluded + 1, ..., n-1 to 0, 1, ..., excluded + 1, ..., n
  return rand < excluded ? rand : rand + 1;
}

export const randomItem = <T>(...items: T[]): T => items[randomInt(0, items.length)];

export const round = (x: number, n: number) => Math.round(x * 10 ** n) / 10 ** n;