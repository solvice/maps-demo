'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Solvice Maps Demo
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Interactive demonstrations of the Solvice routing API capabilities
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/route"
            className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-4">Route Planning</h2>
            </div>
            <p className="text-gray-600">
              Interactive route planning with traffic analysis, alternative routes, and turn-by-turn directions.
            </p>
          </Link>

          <Link
            href="/table"
            className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-4">Table Sync</h2>
            </div>
            <p className="text-gray-600">
              Distance/duration matrix calculations with traffic impact visualization for multiple waypoints.
            </p>
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          Powered by the Solvice Routing API
        </div>
      </div>
    </div>
  );
}