import React, { useState, useEffect } from 'react';

interface UserRagSettings {
  user_instruction: string;
  system_prompt: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  original_filename: string;
  processing_status: string;
  total_chunks: number;
  created_at: string;
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<UserRagSettings>({
    user_instruction: 'Answer the following question using only the provided context. If the answer is not in your context, say you don\'t know.',
    system_prompt: 'You are a helpful research assistant. Only answer using the provided context.'
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // TODO: Load user settings and uploaded files from database
    loadMockData();
  }, []);

  const loadMockData = async () => {
    try {
      // Load user RAG settings
      const settingsResponse = await fetch('/api/user-rag-settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings({
          user_instruction: settingsData.user_instruction,
          system_prompt: settingsData.system_prompt
        });
      }

      // Load user documents
      const documentsResponse = await fetch('/api/user-documents');
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        setUploadedFiles(documentsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to mock data if API fails
      setUploadedFiles([
        {
          id: '1',
          filename: 'research_paper_1.pdf',
          original_filename: 'Research Paper 1.pdf',
          processing_status: 'completed',
          total_chunks: 45,
          created_at: '2024-12-19T10:30:00Z'
        },
        {
          id: '2',
          filename: 'research_paper_2.pdf',
          original_filename: 'Research Paper 2.pdf',
          processing_status: 'completed',
          total_chunks: 32,
          created_at: '2024-12-19T11:15:00Z'
        }
      ]);
    }
  };

  const handleSettingsSave = async () => {
    try {
      const response = await fetch('/api/user-rag-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Settings saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error saving settings: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // TODO: Implement actual file upload and processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(i);
    }

    // Add mock uploaded file
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      filename: `uploaded_${Date.now()}.pdf`,
      original_filename: files[0].name,
      processing_status: 'completed',
      total_chunks: Math.floor(Math.random() * 50) + 20,
      created_at: new Date().toISOString()
    };

    setUploadedFiles(prev => [newFile, ...prev]);
    setIsUploading(false);
    setUploadProgress(0);
    alert('File upload simulation complete! Implement actual upload logic.');
  };

  const handleChatSend = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = { role: 'user' as const, content: chatMessage };
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsChatLoading(true);

    // TODO: Implement actual RAG chat API call
    setTimeout(() => {
      const aiResponse = { 
        role: 'assistant' as const, 
        content: `This is a placeholder response for: "${userMessage.content}". The actual RAG API will be implemented to use your uploaded documents and configured settings.` 
      };
      setChatHistory(prev => [...prev, aiResponse]);
      setIsChatLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RAG System Admin</h1>
          <p className="mt-2 text-gray-600">
            Configure your RAG system and test the chat interface.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Configuration & Files */}
          <div className="space-y-6">
            {/* RAG Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">RAG Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Instruction
                  </label>
                  <textarea
                    value={settings.user_instruction}
                    onChange={(e) => setSettings(prev => ({ ...prev, user_instruction: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Instruction prepended to user queries..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This text is prepended to the user query and context.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt
                  </label>
                  <textarea
                    value={settings.system_prompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, system_prompt: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="System message for OpenAI..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is sent as the system message to OpenAI.
                  </p>
                </div>

                <button
                  onClick={handleSettingsSave}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Settings
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Choose PDF files
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    PDF files up to 10MB each
                  </p>
                </div>

                {isUploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Processing... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Files List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Files</h2>
              
              {uploadedFiles.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No files uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.original_filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.total_chunks} chunks • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        file.processing_status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {file.processing_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Chat Playground */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chat Playground</h2>
            <p className="text-sm text-gray-600 mb-4">
              Test your RAG system with the configured settings.
            </p>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg mb-4 space-y-3">
              {chatHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Start a conversation to test your RAG system.
                </p>
              ) : (
                chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex space-x-3">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question to test your RAG system..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isChatLoading}
              />
              <button
                onClick={handleChatSend}
                disabled={!chatMessage.trim() || isChatLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
