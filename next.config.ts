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
    ],
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
  
  // Оптимизация производительности
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion', 'firebase'],
  },
  
  webpack: (config, {dev, isServer}) => {
    // Отключаем HMR в dev режиме если нужно
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = { ignored: /.*/ };
    }
    
    // Оптимизация разделения кода
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk для больших библиотек
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Отдельный chunk для Firebase
          firebase: {
            name: 'firebase',
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Отдельный chunk для UI библиотек
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](motion|lucide-react)[\\/]/,
            chunks: 'all',
            priority: 25,
          },
          // Common chunk для переиспользуемого кода
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        },
      },
    };
    
    return config;
  },
};

export default nextConfig;
