import React from 'react'
import Dashboard from './Dashboard'
import Kalpvriksha from './Kalpvriksha'

const DashboardFinal = () => {
  return (
    <div className="relative min-h-screen bg-[#0f131c]">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <Kalpvriksha />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full">
        <Dashboard />
      </div>
    </div>
  )
}

export default DashboardFinal
