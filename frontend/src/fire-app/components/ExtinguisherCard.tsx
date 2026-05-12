import React, { useState } from 'react'
import { computeQuantity, getCoverage } from '../services/extinguishers'

export default function ExtinguisherCard() {
  const [area, setArea] = useState<number>(450)
  const [type, setType] = useState('ABC')
  const [capacity, setCapacity] = useState('6kg')
  const [hazard, setHazard] = useState('Office')

  let result = null
  try {
    result = computeQuantity(area, type, capacity, hazard)
  } catch (e) {
    result = { error: (e as Error).message }
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h4 className="font-semibold">Fire Extinguisher Calculator</h4>
      <div className="mt-3 space-y-2">
        <label>
          Area (m²)
          <input type="number" value={area} onChange={(e) => setArea(parseFloat(e.target.value)||0)} className="w-40 mt-1 p-2 border rounded" />
        </label>

        <div className="flex gap-2">
          <label>
            Type
            <select value={type} onChange={(e)=>setType(e.target.value)} className="mt-1 p-2 border rounded">
              <option>ABC</option>
              <option>CO2</option>
              <option>Foam</option>
              <option>Water</option>
              <option>Wet</option>
            </select>
          </label>
          <label>
            Capacity
            <select value={capacity} onChange={(e)=>setCapacity(e.target.value)} className="mt-1 p-2 border rounded">
              <option>1kg</option>
              <option>2kg</option>
              <option>4kg</option>
              <option>6kg</option>
              <option>9kg</option>
            </select>
          </label>
        </div>

        <label>
          Hazard
          <input value={hazard} onChange={(e)=>setHazard(e.target.value)} className="w-full mt-1 p-2 border rounded" />
        </label>

        <div className="mt-3">
          {result && result.error ? (
            <div className="text-red-500">{result.error}</div>
          ) : (
            <div>
              <div>Coverage: <strong>{result.coverage} m²</strong></div>
              <div>Quantity: <strong>{result.quantity}</strong></div>
              <div>Status: <strong>{result.status}</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
