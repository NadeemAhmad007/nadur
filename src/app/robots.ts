import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/portal/', '/auth/'],
      },
    ],
    sitemap: 'https://kasheer360.com/sitemap.xml',
  };
}
