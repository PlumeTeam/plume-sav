/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@plume/db', '@plume/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gxighesxbavnzzyngjaz.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/jbintheair/NeawBrand/**',
      },
      {
        protocol: 'https',
        hostname: 'plume-images-cdn.vercel.app',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@plume/ui'],
  },
}

export default nextConfig
