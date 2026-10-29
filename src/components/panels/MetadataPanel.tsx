import React, { useState } from 'react';
import { ImageItem } from '@/types';
import { Button } from '../ui/Button';
import {
  ShieldAlert,
  ShieldCheck,
  Camera,
  Trash2,
  ExternalLink,
  Search,
} from 'lucide-react';

interface MetadataPanelProps {
  activeImage: ImageItem | null;
  onStripMetadata: () => void;
  isProcessing: boolean;
}

export function MetadataPanel({
  activeImage,
  onStripMetadata,
  isProcessing,
}: MetadataPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const meta = activeImage?.metadata;
  const hasGps = meta?.gpsLatitude !== undefined && meta?.gpsLongitude !== undefined;
  const tagCount = meta?.rawTags ? Object.keys(meta.rawTags).length : 0;

  const filteredTags = Object.entries(meta?.rawTags || {}).filter(
    ([k, v]) =>
      k.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(v).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Privacy Status Banner */}
      {hasGps ? (
        <div className="p-3.5 rounded-xl bg-[#FEE2E2] dark:bg-[#7F1D1D] border border-[#FCA5A5] dark:border-[#EF4444] text-[#991B1B] dark:text-[#FECACA] flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold">
              High Privacy Risk: Exact GPS Location Found!
            </span>
            <p className="text-[11px] leading-relaxed">
              Coordinates: {meta?.gpsLatitude?.toFixed(5)}°, {meta?.gpsLongitude?.toFixed(5)}°
              {meta?.gpsAltitude && ` • Altitude: ${meta.gpsAltitude.toFixed(1)}m`}
            </p>
            <a
              href={`https://www.google.com/maps?q=${meta?.gpsLatitude},${meta?.gpsLongitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] underline font-semibold inline-flex items-center gap-1 mt-0.5"
            >
              View on Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : tagCount > 0 ? (
        <div className="p-3.5 rounded-xl bg-[#FEF3C7] dark:bg-[#78350F] border border-[#FCD34D] dark:border-[#F59E0B] text-[#92400E] dark:text-[#FEF3C7] flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold">
              {tagCount} EXIF & Device Metadata Tags Detected
            </span>
            <p className="text-[11px]">
              Image contains camera hardware profile, timestamp, and software records.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-[#DCFCE7] dark:bg-[#14532D] border border-[#86EFAC] dark:border-[#22C55E] text-[#166534] dark:text-[#BBF7D0] flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold">
              Image is 100% Sanitized & Metadata-Free
            </span>
            <p className="text-[11px]">
              No EXIF, GPS coordinates, serial numbers, or tracking tags are present.
            </p>
          </div>
        </div>
      )}

      {/* Hardware Table / Card Layout */}
      {tagCount > 0 && (
        <div className="rounded-xl border border-[#CBD5E1] dark:border-[#334155] overflow-hidden">
          <div className="px-3.5 py-2.5 bg-[#F1F5F9] dark:bg-[#1E293B] border-b border-[#CBD5E1] dark:border-[#334155] flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Camera & Hardware Profile
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-[#111827] grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-2 rounded-lg border border-[#CBD5E1] dark:border-[#334155]">
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase font-bold block">
                Camera
              </span>
              <span className="text-[#334155] dark:text-[#CBD5E1] font-semibold truncate block">
                {meta?.make || meta?.model
                  ? `${meta.make || ''} ${meta.model || ''}`.trim()
                  : 'Unknown Device'}
              </span>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-2 rounded-lg border border-[#CBD5E1] dark:border-[#334155]">
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase font-bold block">
                Lens
              </span>
              <span className="text-[#334155] dark:text-[#CBD5E1] font-semibold truncate block">
                {meta?.lensModel || 'Standard / Built-in'}
              </span>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-2 rounded-lg border border-[#CBD5E1] dark:border-[#334155]">
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase font-bold block">
                Exposure
              </span>
              <span className="text-[#334155] dark:text-[#CBD5E1] font-semibold truncate block">
                {meta?.fNumber ? `f/${meta.fNumber}` : ''}{' '}
                {meta?.exposureTime ? `${meta.exposureTime}s` : ''}{' '}
                {meta?.iso ? `ISO ${meta.iso}` : ''}
              </span>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-2 rounded-lg border border-[#CBD5E1] dark:border-[#334155]">
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase font-bold block">
                Timestamp
              </span>
              <span className="text-[#334155] dark:text-[#CBD5E1] font-semibold truncate block">
                {meta?.dateTime || 'No timestamp'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Strip Metadata Button */}
      <Button
        onClick={onStripMetadata}
        isLoading={isProcessing}
        variant="danger"
        size="lg"
        className="w-full mt-1"
      >
        <Trash2 className="w-4 h-4 mr-1.5" />
        Strip All EXIF Metadata (Sanitize)
      </Button>

      {/* Raw Tags Inspector with search */}
      {tagCount > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Detected Tags ({tagCount})
            </span>
            <div className="relative w-40">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#64748B] dark:text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#475569] rounded-lg pl-7 pr-2 py-1 text-xs text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#60A5FA]"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] divide-y divide-[#E2E8F0] dark:divide-[#334155]">
            {filteredTags.length > 0 ? (
              filteredTags.map(([k, v]) => (
                <div key={k} className="p-2.5 flex items-baseline justify-between gap-3 text-xs">
                  <span className="font-mono text-[#64748B] dark:text-[#94A3B8] text-[11px] truncate">
                    {k}
                  </span>
                  <span className="font-mono text-[#0F172A] dark:text-[#CBD5E1] text-[11px] font-semibold text-right max-w-[55%] truncate">
                    {String(v)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
                No matching tags found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
