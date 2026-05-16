import { useRef, useEffect } from 'react';
import './GlassPanel.css';

/**
 * GlassPanel — Premium glassmorphism component for Holyroom
 *
 * Props:
 *  variant   : 'default' | 'sidebar' | 'header' | 'footer' | 'modal' | 'card' | 'inset'
 *  glow      : 'none' | 'purple' | 'cyan' | 'blue'   (ambient edge glow color)
 *  shimmer   : boolean  — animated reflection sweep on hover
 *  noise     : boolean  — subtle noise texture overlay
 *  float     : boolean  — gentle floating animation (for cards / modals)
 *  active    : boolean  — pressed/active state
 *  className : string   — extra Tailwind or custom classes
 *  children  : ReactNode
 *  ...rest   — any other div props (onClick, style, etc.)
 *
 * Usage examples:
 *
 *   <GlassPanel variant="card" glow="purple" shimmer float>
 *     Card content
 *   </GlassPanel>
 *
 *   <GlassPanel variant="sidebar" glow="none" className="w-64 h-full">
 *     Sidebar content
 *   </GlassPanel>
 *
 *   <GlassPanel variant="modal" glow="cyan" shimmer noise>
 *     Modal content
 *   </GlassPanel>
 */
export default function GlassPanel({
  variant = 'default',
  glow = 'none',
  shimmer = false,
  noise = false,
  float = false,
  active = false,
  className = '',
  children,
  ...rest
}) {
  const panelRef = useRef(null);
  const shimmerRef = useRef(null);

  // Mouse-tracking edge glow — moves a radial highlight along the border
  useEffect(() => {
    const el = panelRef.current;
    if (!el || glow === 'none') return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mouse-x', `${x}%`);
      el.style.setProperty('--mouse-y', `${y}%`);
    };

    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, [glow]);

  // Build class string
  const classes = [
    'glass-panel',
    `glass-panel--${variant}`,
    glow !== 'none' ? `glass-panel--glow-${glow}` : '',
    shimmer ? 'glass-panel--shimmer' : '',
    noise ? 'glass-panel--noise' : '',
    float ? 'glass-panel--float' : '',
    active ? 'glass-panel--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={panelRef} className={classes} {...rest}>
      {/* Inner reflection layer */}
      <div className="glass-panel__reflection" aria-hidden="true" />

      {/* Shimmer sweep overlay */}
      {shimmer && (
        <div ref={shimmerRef} className="glass-panel__shimmer" aria-hidden="true" />
      )}

      {/* Noise texture overlay */}
      {noise && <div className="glass-panel__noise" aria-hidden="true" />}

      {/* Edge glow border */}
      {glow !== 'none' && (
        <div className="glass-panel__edge-glow" aria-hidden="true" />
      )}

      {/* Content */}
      <div className="glass-panel__content">{children}</div>
    </div>
  );
}
