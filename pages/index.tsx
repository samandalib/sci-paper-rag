import React from 'react';
import Head from 'next/head';
import RagAIAssistantHero from '../components/sections/RagAIAssistantHero';

export default function Home() {
  return (
    <>
      <Head>
        <title>Sci-Paper RAG - Research Paper AI Assistant</title>
        <meta name="description" content="AI-powered research paper assistant with PDF preprocessing and RAG capabilities" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Sci-Paper RAG
                </h1>
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Beta
                </span>
              </div>
              <nav className="flex space-x-8">
                <a href="/admin/rag" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Admin
                </a>
                <a href="/docs" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Docs
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Research Papers
              <span className="block text-blue-600">Made Simple</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Upload your research papers, get instant AI-powered answers, and explore your documents through intelligent conversation.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <a
                  href="#chat"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Start Chatting
                </a>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <a
                  href="/admin/rag"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                >
                  Upload Papers
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h3 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Everything you need for research
              </h3>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                From PDF processing to intelligent Q&A, we've got you covered.
              </p>
            </div>
            
            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {/* PDF Processing */}
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="mt-6 text-lg font-medium text-gray-900">PDF Processing</h4>
                  <p className="mt-2 text-base text-gray-500">
                    Upload research papers and automatically extract, chunk, and embed text for AI processing.
                  </p>
                </div>

                {/* AI Chat */}
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white mx-auto">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h4 className="mt-6 text-lg font-medium text-gray-900">AI Chat Interface</h4>
                  <p className="mt-2 text-base text-gray-500">
                    Ask questions about your research papers and get intelligent, context-aware answers.
                  </p>
                </div>

                {/* Vector Search */}
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white mx-auto">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="mt-6 text-lg font-medium text-gray-900">Vector Search</h4>
                  <p className="mt-2 text-base text-gray-500">
                    Find relevant information across your documents using advanced semantic search.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chat Interface */}
        <section id="chat" className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-extrabold text-gray-900">
                Chat with Your Research Papers
              </h3>
              <p className="mt-4 text-lg text-gray-500">
                Upload papers through the admin panel, then ask questions here.
              </p>
            </div>
            
            <RagAIAssistantHero />
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-base text-gray-400">
                &copy; 2024 Sci-Paper RAG. Built with Next.js, Supabase, and OpenAI.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
