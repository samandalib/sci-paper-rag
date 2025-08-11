/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/rag-chat',
        destination: '/api/rag-chat',
      },
      {
        source: '/api/rag-retrieve',
        destination: '/api/rag-retrieve',
      },
      {
        source: '/api/document-stats',
        destination: '/api/document-stats',
      },
      {
        source: '/api/user-rag-settings',
        destination: '/api/user-rag-settings',
      },
      {
        source: '/api/user-documents',
        destination: '/api/user-documents',
      },
    ];
  },
};

module.exports = nextConfig;
