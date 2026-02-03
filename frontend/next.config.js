/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'vercel.app', 'railway.app', 'www.queenhillsmurree.com'],
    unoptimized: true, // Disable optimization for Vercel compatibility
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  },
  // Enable static exports for Vercel
  output: 'standalone',
  // Optimize for production
  compress: true,
  // Enable experimental features
  experimental: {
    // optimizeCss: true, // Disabled due to critters dependency issue
  },
}

module.exports = nextConfig 