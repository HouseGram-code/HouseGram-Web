import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,

  // Оптимизация производительности
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion', 'firebase'],
  },

  webpack: (config, { dev }) => {
    // Оптимизация разделения кода (расширяем существующую конфигурацию)
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          firebase: {
            name: 'firebase',
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](motion|lucide-react)[\\/]/,
            chunks: 'all',
            priority: 25,
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
