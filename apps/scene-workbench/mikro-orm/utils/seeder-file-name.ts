import { words } from 'es-toolkit';

export function seederFileName(string: string) {
  return words(string).reduce((acc, curr, idx, arr) => {
    const word = curr.toLowerCase();

    if (idx === 0) {
      return word;
    }

    if (idx === arr.length - 1) {
      if (word === 'seeder') {
        return acc + '.seeder';
      }

      return acc + '-' + word + '.seeder';
    }

    return acc + '-' + word;
  }, '');
}
