import type {NextConfig} from 'next';

// Заголовки безопасности применяются ко всем ответам.
// CSP сознательно не слишком строгий: проект использует inline-стили
// (Tailwind/Next), webp с GitHub raw, Firebase, Supabase, ImgBB и т.п.
// Если что-то ломается в CSP — нужно явно разрешать конкретный хост,
// а не ослаблять политику глобально.
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data: https:",
      // Next.js dev/build внедряет inline-скрипты hydration; для prod
      // оставляем 'unsafe-inline' только для скриптов первого рендера.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "connect-src 'self' https: wss:",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join('; '),
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=(), browsing-topics=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
];

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

  experimental: {
    optimizePackageImports: ['lucide-react', 'motion', 'firebase'],
  },

  async headers() {
    return [
      {
        // Применяем security headers на все маршруты.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  webpack: (config, { dev }) => {
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
