import ExifReader from 'exifreader';
import { ImageMetadata } from '@/types';

export async function extractExifMetadata(file: File): Promise<ImageMetadata | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    const rawTags: Record<string, string | number | undefined> = {};
    const flat = ExifReader.load(arrayBuffer);

    let tagCount = 0;
    for (const [key, value] of Object.entries(flat)) {
      if (value && typeof value === 'object' && 'description' in value) {
        rawTags[key] = String(value.description);
        tagCount++;
      } else if (value !== undefined) {
        rawTags[key] = String(value);
        tagCount++;
      }
    }

    if (tagCount === 0) {
      return null;
    }

    // Extract key fields cleanly
    const make = flat['Make']?.description || flat['make']?.description;
    const model = flat['Model']?.description || flat['model']?.description;
    const dateTime =
      flat['DateTimeOriginal']?.description ||
      flat['DateTime']?.description ||
      flat['DateCreated']?.description;
    const software = flat['Software']?.description || flat['software']?.description;
    const focalLength = flat['FocalLength']?.description;
    const exposureTime = flat['ExposureTime']?.description;
    const fNumber = flat['FNumber']?.description;
    const iso = flat['ISOSpeedRatings']?.description || flat['PhotographicSensitivity']?.description;
    const lensModel = flat['LensModel']?.description || flat['Lens']?.description;
    const colorSpace = flat['ColorSpace']?.description;

    let gpsLatitude: number | undefined;
    let gpsLongitude: number | undefined;
    let gpsAltitude: number | undefined;

    // Check GPS
    if (tags.gps) {
      if (typeof tags.gps.Latitude === 'number') {
        gpsLatitude = tags.gps.Latitude;
      }
      if (typeof tags.gps.Longitude === 'number') {
        gpsLongitude = tags.gps.Longitude;
      }
      if (typeof tags.gps.Altitude === 'number') {
        gpsAltitude = tags.gps.Altitude;
      }
    }

    return {
      make,
      model,
      dateTime,
      software,
      focalLength,
      exposureTime,
      fNumber,
      iso,
      lensModel,
      gpsLatitude,
      gpsLongitude,
      gpsAltitude,
      colorSpace,
      rawTags,
    };
  } catch (err) {
    console.warn('No EXIF or unable to parse:', err);
    return null;
  }
}

/**
 * Strips all metadata by loading the image into a canvas and re-encoding it.
 * Browsers do NOT copy EXIF metadata to 2D canvas exports, resulting in 100% metadata-free bytes.
 */
export async function stripImageMetadata(
  imageElement: HTMLImageElement,
  format: string = 'image/jpeg',
  quality: number = 0.95
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Draw clean pixels
  ctx.drawImage(imageElement, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate stripped image blob'));
      },
      format,
      quality
    );
  });
}
