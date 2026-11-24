import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export default function (phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    process.env.NEXT_PHASE = phase;
  }

  return {
    compress: true,
    experimental: {
      optimizePackageImports: ['lucide-react'],
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
