import { lerp } from './lerp.js';

describe('lerp', () => {
  it('interpolates to upper bound', () => {
    const value = lerp(1, 100, 1000);
    expect(value).toBe(1000);
  });

  it('interpolates to the lower bound', () => {
    const value = lerp(0, 100, 1000);
    expect(value).toBe(100);
  });

  it('interpolates linearly', () => {
    const value = lerp(0.5, 0, 100);
    expect(value).toBe(50);
  });
});
