import React from 'react';
import { ImageSizeReducerClient } from '@/components/images/ImageSizeReducerClient';
import { ToolSeoSection } from '@/components/seo/ToolSeoSection';

export default function ImageSizeReducerPage() {
  return (
    <ImageSizeReducerClient>
      <ToolSeoSection profileId="image-size-reducer" />
    </ImageSizeReducerClient>
  );
}
