import { useBackgroundStore } from '@/stores/backgroundStore';
import { Z_INDEX } from '@/utils/zIndex';

const OVERLAY_TRANSITION = 'opacity 300ms ease';

function ImageBackground({ path, fit, opacity, blur }: { path: string; fit: string; opacity: number; blur: number }) {
  const objectFit = fit === 'tile' ? 'cover' : fit as React.CSSProperties['objectFit'];

  return (
    <div
      className="absolute inset-0"
      style={{
        opacity,
        transition: 'opacity 300ms ease',
      }}
    >
      <img
        src={path}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{
          objectFit: fit === 'tile' ? undefined : objectFit,
          ...(fit === 'tile'
            ? { backgroundImage: `url("${path}")`, backgroundRepeat: 'repeat', backgroundSize: 'auto' }
            : {}),
          display: fit === 'tile' ? 'none' : undefined,
        }}
        draggable={false}
      />
      {blur > 0 && (
        <div className="absolute inset-0" style={{ backdropFilter: `blur(${blur}px)` }} />
      )}
    </div>
  );
}

function ColorBackground({ color, opacity }: { color: string; opacity: number }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: color,
        opacity,
        transition: 'opacity 300ms ease',
      }}
    />
  );
}

function GradientBackground({ gradient, opacity }: { gradient: string; opacity: number }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: gradient,
        opacity,
        transition: 'opacity 300ms ease',
      }}
    />
  );
}

export function BackgroundLayer() {
  const config = useBackgroundStore((s) => s.config);

  if (config.type === 'none') return null;

  const renderBackground = () => {
    switch (config.type) {
      case 'color':
        return <ColorBackground color={config.color || '#000000'} opacity={config.opacity} />;
      case 'gradient':
        return <GradientBackground gradient={config.gradient || ''} opacity={config.opacity} />;
      case 'image':
        return (
          <ImageBackground
            path={config.imagePath || ''}
            fit={config.imageFit || 'cover'}
            opacity={config.opacity}
            blur={config.blur}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none"
      style={{ zIndex: Z_INDEX.BACKGROUND }}
    >
      <div className="absolute inset-0" style={{ transition: OVERLAY_TRANSITION }}>
        {renderBackground()}
      </div>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: config.overlayColor,
          opacity: config.overlayOpacity,
          transition: OVERLAY_TRANSITION,
        }}
      />
    </div>
  );
}
