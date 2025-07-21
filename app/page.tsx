'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Maps Demo
        </h1>
        
        <p className="text-gray-600 mb-8 text-center">
          Choose a demo to explore:
        </p>
        
        <div className="space-y-4">
          <Link
            href="/route"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors duration-200"
          >
            Route Planning Demo
          </Link>
          
          <Link
            href="/table"
            className="block w-full bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors duration-200 cursor-not-allowed"
            aria-disabled="true"
          >
            Table Demo (Coming Soon)
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Interactive mapping and routing demonstrations
          </p>
        </div>
      </div>
    </main>
  );
}