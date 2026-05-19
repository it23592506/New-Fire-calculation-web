export const COVERAGE: Record<string, number> = {
  'ABC:1kg': 25,
  'ABC:2kg': 40,
  'ABC:4kg': 60,
  'ABC:6kg': 125,
  'ABC:9kg': 200,
  'CO2:2kg': 10,
  'CO2:5kg': 25,
  'Foam:6L': 100,
  'Foam:9L': 150,
  'Water:6L': 100,
  'Water:9L': 200,
  'Wet:3L': 50,
  'Wet:6L': 100,
}

function keyFor(type: string, capacity: string) {
  const t = (type||'').toLowerCase()
  if (t.includes('abc')) return `ABC:${capacity}`
  if (t.includes('co')) return `CO2:${capacity}`
  if (t.includes('foam')) return `Foam:${capacity}`
  if (t.includes('water')) return `Water:${capacity}`
  if (t.includes('wet')) return `Wet:${capacity}`
  return `${type}:${capacity}`
}

export function getCoverage(type: string, capacity: string) {
  return COVERAGE[keyFor(type, capacity)] || null
}

export function computeQuantity(area: number, type: string, capacity: string, hazard = '') {
  if (!Number.isFinite(area) || area <= 0) throw new Error('Area must be > 0')
  if (!type || !capacity) throw new Error('Type and capacity required')
  const coverage = getCoverage(type, capacity)
  if (!coverage) throw new Error('Unknown coverage')
  const raw = area / coverage
  let N = Math.ceil(raw)
  if (N < 1) N = 1
  let status = 'PASS'
  const messages: string[] = []
  const hazardLower = (hazard||'').toLowerCase()
  const typeLower = (type||'').toLowerCase()
  if (hazardLower.includes('electrical') && typeLower.includes('water')) {
    status = 'FAIL'
    messages.push('Water not suitable for electrical rooms')
  }
  if (hazardLower.includes('kitchen') && typeLower.includes('co2')) {
    if (status !== 'FAIL') status = 'WARNING'
    messages.push('CO2 not recommended for kitchens')
  }
  return { area, type, capacity, coverage, quantity: N, status, messages }
}
