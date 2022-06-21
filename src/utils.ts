
export function* generatePermutations<T>(...iters: Iterable<T>[]): Generator<T[]> {
  if(iters.length === 0) {
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

export const randomItem = <T>(...items: T[]): T => items[randomInt(0, items.length)];

export const round = (x: number, n: number) => Math.round(x * 10**n) / 10**n;