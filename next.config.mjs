// next.config.mjs
import withBundleAnalyzer from '@next/bundle-analyzer';

// We remove next-pwa if you want your own custom sw.js:
const disablePWA = true; // set true to rely on your custom SW

/** @type {import('next').NextConfig} */
let baseConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Add headers configuration for cache control
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Specific for manifest.json
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.deezer.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-images.dzcdn.net',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  webpack(config, { dev }) {
    // This alias is optional. If you want to keep it, ensure the path is correct
    config.resolve.alias['@'] = new URL('./src', import.meta.url).pathname;

    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      };
    }

    // Example: compress images at build time
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'image-webpack-loader',
          options: {
            mozjpeg: { progressive: true, quality: 65 },
            optipng: { enabled: true },
            pngquant: { quality: [0.65, 0.9], speed: 4 },
            gifsicle: { interlaced: false },
            webp: { quality: 75 },
          },
        },
      ],
    });

    return config;
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lodash', 'date-fns'],
    scrollRestoration: true,
  },

  compress: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  poweredByHeader: false,
  generateEtags: false, // Disable ETags to prevent caching based on content hash
};

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

let finalConfig = baseConfig;

// If you wanted to keep next-pwa, you'd import it here and wrap.
// But we disable it entirely so your custom sw.js can be used.
export default withBundleAnalyzerConfig(finalConfig);