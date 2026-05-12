import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'

export default function App() {
  const [dark, setDark] = useState(false)
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="flex">
          <Sidebar onToggleTheme={() => setDark((d) => !d)} />
          <main className="flex-1 p-6">
            <Dashboard />
          </main>
        </div>
      </div>
    </div>
  )
}
