export function fireLoad(materials: { mass:number; calorific:number }[]) {
  if (!Array.isArray(materials) || materials.length === 0) throw new Error('materials required')
  let Q = 0
  for (const m of materials) {
    if (!Number.isFinite(m.mass) || m.mass <= 0) throw new Error('mass must be > 0')
    if (!Number.isFinite(m.calorific) || m.calorific <= 0) throw new Error('calorific must be > 0')
    Q += m.mass * m.calorific
  }
  return Math.round(Q*100)/100
}

export function area(L:number, W:number) {
  if (!Number.isFinite(L) || !Number.isFinite(W) || L<=0 || W<=0) throw new Error('L and W must be > 0')
  return Math.round(L*W*100)/100
}

export function volume(L:number,W:number,H:number){
  if (!Number.isFinite(H) || H<=0) throw new Error('H must be > 0')
  return Math.round(L*W*H*100)/100
}
