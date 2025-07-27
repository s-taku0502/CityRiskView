'use client'

/* 見直しして */
import { useState } from 'react'

export default function EvacuationAlert({ alerts }) {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())

  const getAlertIcon = (type) => {
    switch (type) {
      case 'earthquake': return '地震'
      case 'flood': return '洪水'
      case 'fire': return '火災'
      case 'weather': return '天候'
      default: return '注意'
    }
  }

  const getAlertColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-600 border-red-700'
      case 'medium': return 'bg-orange-500 border-orange-600'
      case 'low': return 'bg-yellow-500 border-yellow-600'
      default: return 'bg-gray-500 border-gray-600'
    }
  }

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id))

  if (visibleAlerts.length === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`${getAlertColor(alert.level)} text-white p-4 border-b-2`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold px-2 py-1 bg-white bg-opacity-20 rounded">
                  {getAlertIcon(alert.type)}
                </span>
                <div>
                  <h4 className="font-bold text-lg">{alert.title}</h4>
                  <p className="text-sm opacity-90">{alert.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    発表時刻: {new Date(alert.timestamp).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}