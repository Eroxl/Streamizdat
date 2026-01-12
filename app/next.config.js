/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: { 
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**',
      }
    ]
    // NOTE: Add any other domains you might fetch images from here
  },
};

module.exports = nextConfig;
