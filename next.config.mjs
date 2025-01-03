import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enable strict mode for better debugging and warnings
  swcMinify: true, // Keep this enabled for faster builds
  images: {
    // Use the new `remotePatterns` configuration instead of `domains`
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
  },
  webpack(config) {
    config.resolve.alias['@'] = new URL('./src', import.meta.url).pathname;
    return config;
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in development to avoid errors
});

export default withPWAConfig(nextConfig);
