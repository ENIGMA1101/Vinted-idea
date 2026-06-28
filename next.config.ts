import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ir.ebaystatic.com' },
      { protocol: 'https', hostname: 'i.ebayimg.com' },
    ],
  },
}

export default nextConfig
