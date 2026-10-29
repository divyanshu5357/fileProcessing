# PixelKit — All-in-One Image Utility

> **A privacy-first, browser-based image toolkit for everyday workflows.**  
> *"Your images are processed locally in your browser and are never uploaded to our servers."*

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-166534?style=flat&logo=shield)](/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%20AA%20Compliant-2563eb?style=flat)](/)

---

## 🌟 Core Philosophy & Privacy Architecture

Most online image tools require uploading sensitive files, personal photos, or confidential client screenshots to third-party servers.

**PixelKit operates on a zero-upload architecture:**
- **100% In-Browser Execution**: All compression, resizing, color quantization, and canvas rendering execute directly on your device via the HTML5 Canvas API, WebWorkers, and WebAssembly.
- **Zero Server Uploads**: Sensitive images and photos never leave your computer.
- **No Account Required**: Completely free, offline-capable, and requires no registration, logins, cookies, or analytics tracking.
- **Volatile Memory**: Closing the browser tab instantly flushes all temporary memory buffers.

---

## 🛠️ Complete Tool Suite

### 1. 🗜️ Image Compression
- **Quality Control**: Continuous slider (5% to 98%) balancing visual fidelity and file size savings.
- **Target File Size**: Quick constraints (`Auto`, `200 KB`, `500 KB`, `1 MB`, `2 MB`).
- **Max Dimension Bounds**: Constraint presets for 4K (3840px), Full HD (1920px), HD (1280px), and Web (800px).
- **Format Re-encoding**: Export as modern WebP, JPEG, or keep original format.
- **Interactive Before/After Split Slider**: Drag a vertical divider directly over the image to inspect live visual quality and byte savings.

### 2. 📐 Resolution Resizing
- **Dimensions Mode**: Exact custom width and height with an **Aspect Ratio Lock** toggle.
- **Percentage Mode**: Scale multipliers (`25%`, `50%`, `75%`, `200%`) or custom fractional percentages.
- **Social & Platform Presets**:
  - Instagram Post (`1080 × 1080`)
  - Instagram Story / Reel (`1080 × 1920`)
  - YouTube Thumbnail (`1280 × 720`)
  - Twitter / X Header (`1500 × 500`)
  - Twitter / X Post (`1200 × 675`)
  - LinkedIn Banner (`1584 × 396`)
  - Full HD (`1920 × 1080`)
  - Favicon (`64 × 64`)
- **Resampling Algorithms**: High-quality Bicubic smoothing or Nearest-neighbor pixelated mode.

### 3. 🔄 Multi-Format Conversion
- **Supported Formats**: **WebP, PNG, JPEG, AVIF, SVG vector wrapper, and printable PDF Document**.
- **Lossy Quality Tuning**: Configurable encoding quality for WebP and JPEG.
- **Alpha Background Fill**: Replace transparent backgrounds with White (`#FFFFFF`), Black (`#000000`), or custom hex when converting transparent PNGs to JPEG.

### 4. ✂️ Interactive Cropping
- **Aspect Ratio Presets**: `1:1 Square`, `16:9 Widescreen`, `4:3 Standard`, `3:2 Photo`, `9:16 Stories`, `Circular Crop` (avatars & profile badges), and `Freeform`.
- **Live Dimension Readout**: Real-time pixel width, height, and percentage coordinates.
- **Quick Reset**: One-click reset to center framing.

### 5. 🔄 Rotation & Horizon Leveling
- **Step Rotations**: 90° Clockwise, 90° Counter-Clockwise, and 180° rotation.
- **Fine Angle Leveler**: `-45° to +45°` fractional angle slider to straighten crooked horizon lines.
- **Auto-Bounding Expansion**: Expands canvas geometry so rotated image corners are never cut off.
- **Mirroring**: Horizontal flip and Vertical flip.

### 6. 🛡️ EXIF Metadata Inspector & Sanitizer
- **Hardware Profile**: Extracts Camera Make/Model, Lens type, Focal length, Aperture (f-stop), ISO speed, Shutter speed, and creation timestamps.
- **GPS Privacy Hazard Detection**: Identifies exact embedded latitude/longitude coordinates with one-click Google Maps verification.
- **One-Click Metadata Stripping**: Clean re-encoding on HTML5 Canvas completely eliminates all EXIF, IPTC, XMP, and device serial tracking tags.
- **Searchable Tag Inspector**: Filter and examine all technical metadata tags.

### 7. 🎨 Dominant Color Palette Extractor
- **Quantitative Color Analysis**: Extracts 4, 6, 8, or 10 dominant colors with percentage representation.
- **Multi-Format Color Readout**: Shows **HEX**, **RGB**, and **HSL** values with instant one-click copying.
- **Accessibility & Contrast**: Built-in WCAG contrast checking against black and white text.
- **Interactive Eyedropper**: Click anywhere on the image to sample the exact color of any individual pixel.
- **Developer Export**: Copy palette as CSS Variables, Tailwind Config JSON, or download as a high-res PNG swatch card.

### 8. ✨ Screenshot Beautifier
- **Window Frames**: macOS window with traffic light buttons, Windows 11 window controls, or floating shadow only.
- **Curated Gradients**: *Deep Aurora, Sunset Glow, Cyberpunk, Midnight Blue, Royal Velvet, Minimal Slate, Warm Peach, Forest Mint*, or solid color backdrops.
- **Padding & Radius**: Customizable canvas padding (16px to 120px) and corner radius (0px to 32px).
- **Drop Shadows**: Five shadow depth profiles (*None, Soft, Medium, Hard, Floating 3D*).
- **Retina Export**: Render at 1x standard or 2x Retina high-resolution.

### 9. 🛂 Passport & Visa Photo Studio
- **Official Country Standards**:
  - **US Passport / Visa**: 2 × 2 inches (51 × 51 mm) @ 300 DPI
  - **Schengen / EU Visa**: 35 × 45 mm (ICAO compliant)
  - **India Passport / OCI**: 35 × 45 mm and 51 × 51 mm
  - **UK Passport**: 35 × 45 mm
  - **Canada Passport**: 50 × 70 mm
  - **China Visa / Passport**: 33 × 48 mm
  - **Custom Dimensions**: User-specified millimeter width and height
- **Biometric Head Guidelines**: ICAO standard crown-of-head and chin alignment guide overlays.
- **Background Replacement**: Off-White (`#F4F4F6`), Pure White (`#FFFFFF`), Light Blue (`#C5D8E8`), Light Grey (`#E2E8F0`), or original background.
- **Print Sheet Generation**:
  - **Single Photo**: High-resolution 300 DPI photo for digital visa submissions.
  - **4 × 6 inch Print Sheet**: Tiles 4 to 6 photos with dashed cutting marks for standard photo paper printing at kiosks/pharmacies.
  - **A4 Document Print Sheet**: Tiles 8 to 12 photos for home printing.
- **PDF Document Export**: Download print-ready PDF files directly from the browser.

### 10. 📦 Batch Studio & ZIP Packaging
- **Bulk Queue**: Upload dozens of images simultaneously or drag-and-drop folders.
- **Batch Operations**: Execute Batch Compress, Batch Convert, Batch Resize, or Batch Strip EXIF across all images with one click.
- **Live Progress**: Status indicators and byte savings for each file in the queue.
- **Zipped Download**: Package all processed assets into a single zipped archive (`pixelkit_processed.zip`) via JSZip.

---

## 🌓 Accessibility & Color System

PixelKit is built with accessibility in mind, supporting both a **Light Mode** and **Dark Mode** with strict WCAG AA contrast standards.

### Color Tokens

| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| **Page Background** | `#F8FAFC` | `#0F172A` | Base viewport background |
| **Main Surface / Cards** | `#FFFFFF` | `#111827` | Tool cards, panels, upload zone |
| **Secondary Surface** | `#F1F5F9` | `#1E293B` | Header bars, table headers, controls |
| **Borders** | `#CBD5E1` | `#334155` | Card borders, inputs, dividers |
| **Strong Borders** | `#94A3B8` | `#475569` | Active borders, drag-hover outlines |
| **Primary Text** | `#0F172A` | `#F8FAFC` | Headings, active values (> 12:1 contrast) |
| **Secondary Text** | `#334155` | `#CBD5E1` | Paragraphs, labels, descriptions |
| **Muted Text** | `#64748B` | `#94A3B8` | Helper text, metadata keys |
| **Primary Brand Button** | `#2563EB` | `#3B82F6` | Primary actions, downloads (White text) |
| **Secondary Button** | `#E2E8F0` (`#0F172A` text) | `#334155` (`#F8FAFC` text) | Utility buttons, resets, secondary actions |
| **Success State** | BG: `#DCFCE7`, Text: `#166534` | BG: `#14532D`, Text: `#BBF7D0` | Processed badges, success alerts |
| **Warning State** | BG: `#FEF3C7`, Text: `#92400E` | BG: `#78350F`, Text: `#FEF3C7` | Metadata alerts, warning banners |
| **Error State** | BG: `#FEE2E2`, Text: `#991B1B` | BG: `#7F1D1D`, Text: `#FECACA` | GPS hazard alerts, failure states |

### Key Accessibility Highlights:
- **No Low-Contrast Gray Text**: Minimum contrast ratio of 4.5:1 across all muted labels.
- **No Pure Black / Pure White Backgrounds**: Soft slate dark mode (`#0F172A` / `#111827`) reduces eye strain.
- **Color Extractor Isolation**: Color values are placed inside themed cards rather than overlaid directly on arbitrary extracted colors.
- **Non-Color-Only Indicators**: All status messages combine distinctive icons (`CheckCircle`, `ShieldAlert`, `AlertTriangle`) alongside text labels and colored borders.
- **Persistent Theme Preference**: The selected theme is stored in `localStorage` and falls back gracefully to system `prefers-color-scheme`.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>V</kbd> | Paste screenshot or image directly from clipboard |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>S</kbd> | Download active processed image |
| <kbd>1</kbd> – <kbd>9</kbd> | Quick switch between toolkit operations |
| <kbd>Esc</kbd> | Dismiss open modals and dialogs |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher (v25 supported)
- **npm**: v10 or higher

### Installation

```bash
# Clone or navigate into the repository
cd PixelKit

# Install project dependencies
npm install
```

### Running Locally

```bash
# Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Generate optimized static production bundle
npm run build

# Start production server
npm run start
```

---

## 🏗️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Compression**: [browser-image-compression](https://www.npmjs.com/package/browser-image-compression) + Canvas bicubic fallback
- **Metadata Parsing**: [ExifReader](https://www.npmjs.com/package/exifreader)
- **ZIP Packaging**: [JSZip](https://stuk.github.io/jszip/)
- **PDF Generation**: [pdf-lib](https://pdf-lib.js.org/)
- **Language**: TypeScript (Strict Mode)

---

## 📄 License

Open source and free for personal and commercial use. Built with a focus on user privacy, performance, and accessibility.
