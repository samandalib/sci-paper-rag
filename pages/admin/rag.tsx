import React from 'react';
import Head from 'next/head';
import AdminDashboard from '../../components/AdminDashboard';

export default function AdminPage() {
  return (
    <>
      <Head>
        <title>RAG Admin - Sci-Paper RAG</title>
        <meta name="description" content="Admin interface for managing the RAG system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <a href="/" className="text-gray-500 hover:text-gray-700 mr-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </a>
                <h1 className="text-2xl font-bold text-gray-900">
                  RAG Admin Dashboard
                </h1>
              </div>
              <nav className="flex space-x-8">
                <a href="/" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </a>
                <a href="/docs" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Documentation
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Admin Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <AdminDashboard />
        </div>
      </main>
    </>
  );
}
