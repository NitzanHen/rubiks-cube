
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