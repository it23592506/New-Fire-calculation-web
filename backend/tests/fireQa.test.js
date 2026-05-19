const fireQa = require('../src/utils/fireQa');

describe('fireQa utilities', () => {
  test('computeFireLoad with valid materials', () => {
    const materials = [
      { mass: 100, calorific: 18 },
      { mass: 20, calorific: 35 },
    ];
    const { Q, warnings } = fireQa.computeFireLoad(materials);
    expect(Q).toBeCloseTo(2500, 2);
    expect(Array.isArray(warnings)).toBe(true);
  });

  test('computeFireLoad rejects empty array', () => {
    expect(() => fireQa.computeFireLoad([])).toThrow();
  });

  test('computeFireLoadDensity computes correctly and warns high density', () => {
    const { q, warnings } = fireQa.computeFireLoadDensity(2500, 2);
    expect(q).toBeCloseTo(1250, 2);
    expect(warnings.length).toBeGreaterThan(0);
  });

  test('computeArea and computeVolume basic', () => {
    expect(fireQa.computeArea(10, 5)).toBe(50);
    const { V, warnings } = fireQa.computeVolume(10, 5, 3);
    expect(V).toBe(150);
    expect(Array.isArray(warnings)).toBe(true);
  });
});
