import { MetadataRoute } from 'next';
import { ALL_PDF_TOOLS } from '@/lib/toolRegistry';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.gyanvatsala.in';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/workspace`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pdf`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/scan-studio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/image-converter`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/image-tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${baseUrl}/tools/pdf-editor`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/pdf-assembler`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
  ];

  const highPriorityTools = new Set([
    'pdf-to-word',
    'word-to-pdf',
    'pdf-editor',
    'merge-pdf',
    'compress-pdf',
    'split-pdf',
    'jpg-to-pdf',
    'pdf-to-jpg',
    'protect-pdf',
    'watermark-pdf',
    'pdf-to-excel',
  ]);

  const toolRoutes: MetadataRoute.Sitemap = ALL_PDF_TOOLS.map((tool) => ({
    url: `${baseUrl}/pdf/${tool.id}`,
    lastModified: new Date(),
    changeFrequency: highPriorityTools.has(tool.id) ? 'daily' : 'weekly',
    priority: highPriorityTools.has(tool.id) ? 0.9 : 0.8,
  }));

  return [...staticRoutes, ...toolRoutes];
}
