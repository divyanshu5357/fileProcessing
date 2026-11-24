import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.gyanvatsala.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/_next/static/', '/_next/image/', '/llms.txt'],
        disallow: ['/api/', '/dashboard/settings', '/admin/'],
      },
      {
        userAgent: [
          'Googlebot',
          'Googlebot-Image',
          'Google-InspectionTool',
          'GoogleOther',
          'Google-Extended',
          'Bingbot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'GPTBot',
          'PerplexityBot',
          'ClaudeBot',
          'Applebot',
        ],
        allow: ['/', '/_next/static/', '/_next/image/', '/llms.txt'],
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
