/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Required for static export
  },
  // Use 'export' for Capacitor, 'standalone' for Vercel
  // Change to 'standalone' when deploying to Vercel
  output: process.env.BUILD_MODE === 'capacitor' ? 'export' : 'standalone',
  trailingSlash: true, // Better routing in Capacitor
}

module.exports = nextConfig

