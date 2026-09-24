import type { NextConfig } from 'next'

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = []
try {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (value) {
    const url = new URL(value)
    remotePatterns.push({ protocol: url.protocol.replace(':', '') as 'http' | 'https', hostname: url.hostname, port: url.port, pathname: '/storage/v1/object/public/article-images/**' })
  }
} catch { /* Invalid optional env keeps local empty-state builds working. */ }

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost', '10.0.0.1'],
  images: { remotePatterns },
}
export default nextConfig
