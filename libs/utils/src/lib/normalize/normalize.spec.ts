import { normalize } from './normalize.js';

describe('normalize', () => {
  it('normalizes to lower bound', () => {
    const value = normalize(300, 300, 600);
    expect(value).toBe(0);
  });

  it('normalizes to upper bound', () => {
    const value = normalize(600, 300, 600);
    expect(value).toBe(1);
  });
});
