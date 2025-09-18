/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*',  // Changed from port 5000 to 8000
      },
      // Proxy backend routes directly
      {
        source: '/start-discovery',
        destination: 'http://127.0.0.1:8000/start-discovery',
      },
      {
        source: '/discovery-status/:path*',
        destination: 'http://127.0.0.1:8000/discovery-status/:path*',
      },
      {
        source: '/history/:path*',
        destination: 'http://127.0.0.1:8000/history/:path*',
      },
      {
        source: '/current-user',
        destination: 'http://127.0.0.1:8000/current-user',
      },
      {
        source: '/logout',
        destination: 'http://127.0.0.1:8000/logout',
      },
      {
        source: '/google-login',
        destination: 'http://127.0.0.1:8000/google-login',
      },
      {
        source: '/login',
        destination: 'http://127.0.0.1:8000/login',
      },
      {
        source: '/register',
        destination: 'http://127.0.0.1:8000/register',
      },
    ]
  },
}

export default nextConfig
