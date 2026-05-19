import React from 'react'
import CalculatorCard from './CalculatorCard'
import ExtinguisherCard from './ExtinguisherCard'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="text-sm text-gray-500">Real-time engineering calculations</div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CalculatorCard />
        <ExtinguisherCard />
      </section>

      <section>
        <h3 className="text-lg font-medium">Summary</h3>
        <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded shadow">Results panel (summary)</div>
      </section>
    </div>
  )
}
