/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/today',
        permanent: false,
      },
      {
        source: '/practice',
        destination: '/review',
        permanent: false,
      },
      {
        source: '/learn',
        destination: '/library?tab=kana',
        permanent: false,
      },
      {
        source: '/grammar',
        destination: '/library?tab=grammar',
        permanent: false,
      },
      {
        source: '/reading',
        destination: '/library?tab=reading',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
