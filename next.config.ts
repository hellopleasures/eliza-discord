import type { NextConfig } from 'next'
import type { WebpackConfigContext } from 'next/dist/server/config-shared'

const nextConfig: NextConfig = {
  webpack: (
    config,
    context: WebpackConfigContext
  ) => {
    if (context.isServer) {
      const externals = [...(config.externals || [])]
      externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
        'zlib-sync': 'commonjs zlib-sync',
      })
      config.externals = externals
    }
    return config
  },
}

export default nextConfig;