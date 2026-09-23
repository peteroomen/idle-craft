// Sprites are 32×32; md/lg/xl show them at exactly 1×, 2× and 4× so pixels stay square.
export default function Icon({ imgPath, className, size = 'md', alt = '' }: { imgPath: string; className?: string; size?: 'md' | 'lg' | 'xl'; alt?: string }) {
  const sizeClassMap = {
    md: 'size-8',
    lg: 'size-16',
    xl: 'size-32',
  };

  return <img style={{ imageRendering: 'pixelated' }} src={imgPath} alt={alt} className={`${className ?? ''} ${sizeClassMap[size]}`} />;
}
