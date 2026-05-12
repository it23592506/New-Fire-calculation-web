import React from 'react'
import { FaHome, FaFireExtinguisher } from 'react-icons/fa'

export default function Sidebar({ onToggleTheme }: { onToggleTheme: () => void }) {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold">FireCalc</h1>
        <p className="text-sm text-gray-500">Engineering QA Dashboard</p>
      </div>

      <nav className="space-y-2">
        <a className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaHome /> Home
        </a>
        <a className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <FaFireExtinguisher /> Extinguishers
        </a>
      </nav>

      <div className="mt-6">
        <button onClick={onToggleTheme} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700">Toggle theme</button>
      </div>
    </aside>
  )
}
