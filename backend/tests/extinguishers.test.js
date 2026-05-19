const extinguisher = require('../src/utils/extinguisher');

describe('extinguisher utility', () => {
  test('computes quantity for sample input', () => {
    const res = extinguisher.computeQuantity({ area: 600, type: 'ABC', capacity: '6kg', hazard: 'Office' });
    expect(res.quantity).toBe(4); // ABC 6kg coverage is 150 m2 -> 600/150 = 4
    expect(['PASS','WARNING','FAIL'].includes(res.status)).toBe(true);
  });

  test('rejects non-positive area', () => {
    expect(() => extinguisher.computeQuantity({ area: 0, type: 'ABC', capacity: '6kg' })).toThrow();
  });

  test('electrical room with water returns FAIL', () => {
    const r = extinguisher.computeQuantity({ area: 50, type: 'Water', capacity: '6L', hazard: 'Electrical Room' });
    expect(r.status).toBe('FAIL');
  });

  test('kitchen with CO2 returns WARNING', () => {
    const r = extinguisher.computeQuantity({ area: 120, type: 'CO2', capacity: '5kg', hazard: 'Kitchen' });
    expect(r.status).toBe('WARNING');
  });

  test('travel distance beyond threshold can FAIL', () => {
    const r = extinguisher.computeQuantity({
      area: 120,
      type: 'ABC',
      capacity: '4kg',
      hazard: 'Office',
      travelDistance: 40,
    });
    expect(r.status).toBe('FAIL');
  });
});
