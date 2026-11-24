import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gyanvatsala — Free Online PDF Editor, Image to PDF & Image Size Reducer',
    short_name: 'Gyanvatsala',
    description:
      'Privacy-first online PDF editor, JPG/PNG/IMG to PDF converter, and Image Size Reducer in KB & MB running locally in your browser.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#536BCE',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
