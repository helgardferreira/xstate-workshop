import { clamp } from './clamp.js';

describe('clamp', () => {
  it('clamps to lower bound', () => {
    const value = clamp(-100, 10, 50);
    expect(value).toBe(10);
  });

  it('clamps to upper bound', () => {
    const value = clamp(100, 10, 50);
    expect(value).toBe(50);
  });

  it('remains unaltered when in bounds', () => {
    const value = clamp(25, 10, 50);
    expect(value).toBe(25);
  });
});
