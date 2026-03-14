import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Bridge e WAHA rodam em containers separados
  env: {
    BRIDGE_URL: process.env.BRIDGE_URL || 'http://localhost:3000',
    WAHA_URL: process.env.WAHA_URL || 'http://localhost:3001',
    WAHA_API_KEY: process.env.WAHA_API_KEY || 'changeme',
  },
}

export default nextConfig
