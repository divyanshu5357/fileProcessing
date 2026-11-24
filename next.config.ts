import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export default function (phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    process.env.NEXT_PHASE = phase;
  }

  return {
    poweredByHeader: false,
    compress: true,
    async redirects() {
      return [
        {
          source: '/index.html',
          destination: '/',
          permanent: true,
        },
        {
          source: '/index.htm',
          destination: '/',
          permanent: true,
        },
        {
          source: '/home',
          destination: '/',
          permanent: true,
        },
        // High-intent direct keyword & misspelling 308 redirects -> canonical pages
        { source: '/pdf-editor', destination: '/tools/pdf-editor', permanent: true },
        { source: '/edit-pdf', destination: '/tools/pdf-editor', permanent: true },
        { source: '/pdf-editer', destination: '/tools/pdf-editor', permanent: true },
        { source: '/eddit-pdf', destination: '/tools/pdf-editor', permanent: true },
        { source: '/img-to-pdf', destination: '/pdf/jpg-to-pdf', permanent: true },
        { source: '/image-to-pdf', destination: '/pdf/jpg-to-pdf', permanent: true },
        { source: '/imge-to-pdf', destination: '/pdf/jpg-to-pdf', permanent: true },
        { source: '/jpg-to-pdf', destination: '/pdf/jpg-to-pdf', permanent: true },
        { source: '/png-to-pdf', destination: '/pdf/jpg-to-pdf', permanent: true },
        { source: '/photo-to-pdf', destination: '/pdf/jpg-to-pdf', permanent: true },
        { source: '/img-to-pfd', destination: '/pdf/jpg-to-pdf', permanent: true },
        { source: '/img-size-reducer', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/image-size-reducer', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/reduce-image-size', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/compress-image', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/compres-image', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/image-compressor', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/photo-size-reducer', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/img-size-reduser', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/image-size-reduser', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/mb-to-kb', destination: '/tools/image-size-reducer', permanent: true },
        { source: '/compress-pdf', destination: '/pdf/compress-pdf', permanent: true },
        { source: '/compres-pdf', destination: '/pdf/compress-pdf', permanent: true },
        { source: '/reduce-pdf-size', destination: '/pdf/compress-pdf', permanent: true },
        { source: '/merge-pdf', destination: '/pdf/merge-pdf', permanent: true },
        { source: '/marge-pdf', destination: '/pdf/merge-pdf', permanent: true },
        { source: '/combine-pdf', destination: '/pdf/merge-pdf', permanent: true },
        { source: '/split-pdf', destination: '/pdf/split-pdf', permanent: true },
        { source: '/spilt-pdf', destination: '/pdf/split-pdf', permanent: true },
        { source: '/pdf-to-word', destination: '/pdf/pdf-to-word', permanent: true },
        { source: '/pdf-to-wrod', destination: '/pdf/pdf-to-word', permanent: true },
        { source: '/word-to-pdf', destination: '/pdf/word-to-pdf', permanent: true },
        { source: '/wrod-to-pdf', destination: '/pdf/word-to-pdf', permanent: true },
        { source: '/doc-to-pdf', destination: '/pdf/word-to-pdf', permanent: true },
        { source: '/scan-pdf', destination: '/scan-studio', permanent: true },
        { source: '/look-scanned', destination: '/scan-studio', permanent: true },
      ];
    },
    experimental: {
      optimizePackageImports: ['lucide-react'],
      agentUpgrade: "security",
    },
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
  };
}
