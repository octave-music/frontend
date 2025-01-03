import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['api.deezer.com', 'cdn-images.dzcdn.net'],
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
  disable: process.env.NODE_ENV === 'development', // Disable in development to avoid the errors
});

export default withPWAConfig(nextConfig);