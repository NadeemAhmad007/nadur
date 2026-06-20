import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: '*.s3.amazonaws.com',
      },
      {
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: *.amazonaws.com *.r2.cloudflarestorage.com res.cloudinary.com upload.wikimedia.org *.tile.openstreetmap.org",
              "font-src 'self' data:",
              "connect-src 'self' blob: https://api.open-meteo.com https://api.frankfurter.app https://air-quality-api.open-meteo.com https://en.wikipedia.org https://nominatim.openstreetmap.org https://indianpincode.com",
              "worker-src 'self' blob: https://cdn.jsdelivr.net",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
