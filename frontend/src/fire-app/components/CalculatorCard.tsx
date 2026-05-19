import React, { useState } from 'react'

export default function CalculatorCard() {
  const [L, setL] = useState<number>(10)
  const [W, setW] = useState<number>(5)
  const [H, setH] = useState<number>(3)

  const area = parseFloat((L * W).toFixed(2))
  const volume = parseFloat((L * W * H).toFixed(2))

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h4 className="font-semibold">Geometry</h4>
      <div className="mt-3 space-y-2">
        <div className="flex gap-2">
          <label className="flex-1">
            Length (m)
            <input type="number" value={L} onChange={(e) => setL(parseFloat(e.target.value)||0)} className="w-full mt-1 p-2 border rounded" />
          </label>
          <label className="flex-1">
            Width (m)
            <input type="number" value={W} onChange={(e) => setW(parseFloat(e.target.value)||0)} className="w-full mt-1 p-2 border rounded" />
          </label>
        </div>

        <label>
          Height (m)
          <input type="number" value={H} onChange={(e) => setH(parseFloat(e.target.value)||0)} className="w-48 mt-1 p-2 border rounded" />
        </label>

        <div className="mt-3">
          <div>Area: <strong>{area} m²</strong></div>
          <div>Volume: <strong>{volume} m³</strong></div>
        </div>
      </div>
    </div>
  )
}
