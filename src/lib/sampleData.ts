// Generates test sample image files programmatically so users can immediately test all tools

export interface SampleImageInfo {
  id: string;
  title: string;
  category: string;
  description: string;
  filename: string;
}

export const SAMPLE_IMAGES: SampleImageInfo[] = [
  {
    id: 'sample-portrait',
    title: 'Studio Portrait',
    category: 'Passport & Crop',
    description: 'Clean headshot portrait suitable for testing passport standards, cropping, and color extraction.',
    filename: 'sample_portrait.png',
  },
  {
    id: 'sample-landscape',
    title: 'High-Res Nature Landscape',
    category: 'Compression & Resize',
    description: 'Detailed colorful gradient landscape for compression testing, format conversion, and EXIF.',
    filename: 'sample_landscape.jpg',
  },
  {
    id: 'sample-code',
    title: 'Clean Code Screenshot',
    category: 'Screenshot Beautifier',
    description: 'Code snippet ready to be framed in macOS windows, gradient backgrounds, and soft shadows.',
    filename: 'sample_code_snippet.png',
  },
];

export async function createSampleFile(sampleId: string): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  if (sampleId === 'sample-portrait') {
    canvas.width = 1200;
    canvas.height = 1400;

    // Studio portrait background
    const bg = ctx.createLinearGradient(0, 0, 0, 1400);
    bg.addColorStop(0, '#CBD5E1');
    bg.addColorStop(1, '#94A3B8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 1400);

    // Subtle studio light radial
    const light = ctx.createRadialGradient(600, 500, 50, 600, 500, 600);
    light.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    light.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 1200, 1400);

    // Shoulders
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.ellipse(600, 1300, 420, 260, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = '#E2B29F';
    ctx.fillRect(520, 800, 160, 250);

    // Face / Head
    ctx.fillStyle = '#EBBFA9';
    ctx.beginPath();
    ctx.ellipse(600, 620, 220, 270, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#261C14';
    ctx.beginPath();
    ctx.arc(600, 500, 240, Math.PI, 0, false);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2D3748';
    ctx.beginPath();
    ctx.ellipse(510, 610, 24, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(690, 610, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyeballs
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(514, 608, 5, 0, Math.PI * 2);
    ctx.arc(694, 608, 5, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.strokeStyle = '#CCA18F';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(600, 620);
    ctx.lineTo(595, 690);
    ctx.lineTo(615, 695);
    ctx.stroke();

    // Smile
    ctx.strokeStyle = '#A85D50';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(600, 720, 60, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Sample watermark / tag
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PixelKit Studio Portrait Reference', 600, 1350);

    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    return new File([blob], 'sample_portrait.png', { type: 'image/png' });
  }

  if (sampleId === 'sample-code') {
    canvas.width = 1400;
    canvas.height = 900;

    // Code editor background
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, 1400, 900);

    // Mock header
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 1400, 64);

    // Dots
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(36, 32, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(64, 32, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(92, 32, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '500 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('imageProcessor.ts — PixelKit Core Engine', 140, 38);

    // Code lines
    ctx.font = '22px monospace';
    const lines = [
      { text: 'import { optimizeImage, extractPalette } from "@/pixelkit";', color: '#93C5FD' },
      { text: '', color: '' },
      { text: '// Client-side zero-knowledge image transformation pipeline', color: '#6B7280' },
      { text: 'export async function processAssets(input: File): Promise<Output> {', color: '#F472B6' },
      { text: '  const canvas = document.createElement("canvas");', color: '#E2E8F0' },
      { text: '  const context = canvas.getContext("2d", { alpha: true });', color: '#E2E8F0' },
      { text: '  ', color: '' },
      { text: '  // Strip EXIF metadata completely for guaranteed privacy', color: '#34D399' },
      { text: '  const sanitizedBytes = await stripExifTags(input);', color: '#FBBF24' },
      { text: '  const colors = await extractPalette(sanitizedBytes, 6);', color: '#60A5FA' },
      { text: '  ', color: '' },
      { text: '  return {', color: '#E2E8F0' },
      { text: '    quality: 0.92,', color: '#A78BFA' },
      { text: '    isPrivate: true, // 100% Client-Side In-Browser Execution', color: '#10B981' },
      { text: '    palette: colors.map(c => c.hex),', color: '#F87171' },
      { text: '  };', color: '#E2E8F0' },
      { text: '}', color: '#F472B6' },
    ];

    let y = 130;
    lines.forEach((line, i) => {
      // Line numbers
      ctx.fillStyle = '#374151';
      ctx.fillText(`${(i + 1).toString().padStart(2, ' ')} `, 40, y);

      if (line.text) {
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, 90, y);
      }
      y += 38;
    });

    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    return new File([blob], 'sample_code_snippet.png', { type: 'image/png' });
  }

  // Default: sample-landscape
  canvas.width = 2400;
  canvas.height = 1600;

  // Sunset sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, 1600);
  sky.addColorStop(0, '#0F172A');
  sky.addColorStop(0.3, '#312E81');
  sky.addColorStop(0.55, '#7C2D12');
  sky.addColorStop(0.75, '#C2410C');
  sky.addColorStop(0.88, '#F59E0B');
  sky.addColorStop(1, '#FDE68A');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 2400, 1600);

  // Glowing Sun
  const sunGrad = ctx.createRadialGradient(1200, 1050, 40, 1200, 1050, 320);
  sunGrad.addColorStop(0, '#FFFFFF');
  sunGrad.addColorStop(0.2, '#FEF08A');
  sunGrad.addColorStop(0.6, '#F97316');
  sunGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(1200, 1050, 320, 0, Math.PI * 2);
  ctx.fill();

  // Mountain silhouettes
  ctx.fillStyle = '#1E1B4B';
  ctx.beginPath();
  ctx.moveTo(0, 1300);
  ctx.lineTo(400, 950);
  ctx.lineTo(850, 1200);
  ctx.lineTo(1350, 850);
  ctx.lineTo(1900, 1250);
  ctx.lineTo(2400, 980);
  ctx.lineTo(2400, 1600);
  ctx.lineTo(0, 1600);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#090D16';
  ctx.beginPath();
  ctx.moveTo(0, 1420);
  ctx.lineTo(600, 1150);
  ctx.lineTo(1100, 1380);
  ctx.lineTo(1650, 1100);
  ctx.lineTo(2100, 1350);
  ctx.lineTo(2400, 1200);
  ctx.lineTo(2400, 1600);
  ctx.lineTo(0, 1600);
  ctx.closePath();
  ctx.fill();

  // Foreground lake reflection
  const lakeGrad = ctx.createLinearGradient(0, 1400, 0, 1600);
  lakeGrad.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
  lakeGrad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, 1400, 2400, 200);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '600 48px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('PixelKit 4K Benchmark Sample (2400 × 1600)', 2320, 1540);

  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.92));
  return new File([blob], 'sample_landscape.jpg', { type: 'image/jpeg' });
}
