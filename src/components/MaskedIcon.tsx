export type IconName = 'upload' | 'shield' | 'sparkles' | 'database' | 'table';

type MaskedIconProps = {
  name: IconName;
  iconSources: Record<IconName, string>;
  className?: string;
};

const MaskedIcon: React.FC<MaskedIconProps> = ({ name, iconSources, className = 'h-6 w-6' }) => (
  <span
    className={`block bg-current ${className}`}
    style={{
      WebkitMaskImage: `url(${iconSources[name]})`,
      maskImage: `url(${iconSources[name]})`,
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
    }}
    aria-hidden="true"
  />
);

export default MaskedIcon;
