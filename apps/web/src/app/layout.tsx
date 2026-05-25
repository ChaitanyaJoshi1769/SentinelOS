import React from 'react'
import './globals.css'

export const metadata = {
  title: 'SentinelOS - Autonomous AI-Native SOC Platform',
  description: 'The Autonomous AI-Native Cybersecurity Operations Platform',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-base-100 text-base-content">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-base-200 border-b border-base-300">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-sentinel-400 to-sentinel-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  <h1 className="text-2xl font-bold text-sentinel-400">SentinelOS</h1>
                </div>
                <nav className="hidden md:flex gap-8">
                  <a href="/" className="hover:text-sentinel-400 transition">Dashboard</a>
                  <a href="/investigations" className="hover:text-sentinel-400 transition">Investigations</a>
                  <a href="/graph" className="hover:text-sentinel-400 transition">Threat Graph</a>
                  <a href="/remediation" className="hover:text-sentinel-400 transition">Remediation</a>
                  <a href="/analytics" className="hover:text-sentinel-400 transition">Analytics</a>
                </nav>
                <div className="flex items-center gap-4">
                  <div className="badge badge-success gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    Connected
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-base-200 border-t border-base-300 mt-8">
            <div className="container mx-auto px-4 py-6 text-center text-base-content/60">
              <p>SentinelOS v0.1.0 - Autonomous AI-Native Cybersecurity Operations Platform</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
