import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.gyanvatsala.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/_next/static/', '/_next/image/'],
        disallow: ['/api/', '/dashboard/settings', '/admin/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/_next/static/', '/_next/image/'],
        disallow: ['/api/', '/admin/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/_next/static/', '/_next/image/'],
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
