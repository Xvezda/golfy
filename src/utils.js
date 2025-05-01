// a, b, c ..., aa, bb, cc, ..., Aa, Ab, Ac, ..., aA, aB, aC, ..., zA, zB, zC, ..., a1, b1, c1, ...
export function *generateShortUniqueName() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let index = 0;
  let length = 1;

  while (true) {
    let name = '';
    let tempIndex = index;

    for (let i = 0; i < length; i++) {
      name += alphabet[tempIndex % alphabet.length];
      tempIndex = Math.floor(tempIndex / alphabet.length);
    }

    yield name;

    index++;

    if (index === Math.pow(alphabet.length, length)) {
      index = 0;
      length++;
    }
  }
}
