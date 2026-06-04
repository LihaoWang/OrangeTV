import type { ImgHTMLAttributes } from 'react';

type AppImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  onLoadingComplete?: (image: HTMLImageElement) => void;
};

export default function AppImage({
  fill,
  priority: _priority,
  quality: _quality,
  onLoadingComplete,
  onLoad,
  style,
  ...props
}: AppImageProps) {
  return (
    <img
      {...props}
      onLoad={(event) => {
        onLoad?.(event);
        onLoadingComplete?.(event.currentTarget);
      }}
      style={{
        ...(fill
          ? {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }
          : null),
        ...style,
      }}
    />
  );
}
