import { motion } from 'framer-motion';
import { type ThemePreset, type AccentColor, accentColors } from '../../stores/themeStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | boolean | undefined | null)[]) => twMerge(clsx(inputs));

export interface ThemePreviewProps {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}

const ThemePreview = ({ preset, selected, onSelect }: ThemePreviewProps) => {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border-2 overflow-hidden transition-all duration-200',
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-border-hover'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="h-24 relative p-3"
        style={{ backgroundColor: preset.previewColors.bg }}
      >
        <div className="flex gap-1.5 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.previewColors.accent }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.previewColors.accent, opacity: 0.6 }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.previewColors.accent, opacity: 0.3 }} />
        </div>
        <div
          className="h-10 rounded-lg"
          style={{ backgroundColor: preset.previewColors.surface }}
        >
          <div className="h-full flex items-center px-2">
            <div className="w-12 h-2 rounded-full" style={{ backgroundColor: preset.previewColors.accent, opacity: 0.4 }} />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 flex gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.previewColors.accent, opacity: 0.3 }} />
          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.previewColors.accent, opacity: 0.5 }} />
        </div>
      </div>
      <div className="p-2 bg-surface">
        <p className="text-text-primary text-sm font-medium text-center">{preset.name}</p>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </motion.button>
  );
};

export interface AccentColorPickerProps {
  selected: AccentColor;
  onSelect: (color: AccentColor) => void;
}

export const AccentColorPicker = ({ selected, onSelect }: AccentColorPickerProps) => {
  return (
    <div className="flex gap-3 flex-wrap">
      {(Object.entries(accentColors) as [AccentColor, typeof accentColors[AccentColor]][]).map(([key, value]) => (
        <motion.button
          key={key}
          onClick={() => onSelect(key)}
          className={cn(
            'w-8 h-8 rounded-full transition-all duration-200',
            selected === key ? 'ring-2 ring-offset-2 ring-offset-bg-secondary' : 'hover:scale-110'
          )}
          style={{
            backgroundColor: value.hex,
            
          }}
          whileTap={{ scale: 0.9 }}
          title={value.name}
        />
      ))}
    </div>
  );
};

export default ThemePreview;
