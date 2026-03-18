/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      's.gravatar.com',
      'lh3.googleusercontent.com',
      'uxwing.com',
    ],
  },
};

export default nextConfig;
