/**
 * BorderBeam — rotating conic-gradient border highlight.
 * Uses @property for smooth CSS custom property animation.
 * Falls back gracefully in browsers without @property support.
 */

const KEYFRAMES = `
  @property --bb-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes border-beam-spin {
    to { --bb-angle: 360deg; }
  }
`;

export function BorderBeam({
  colorFrom = '#F0A030',
  colorVia  = 'transparent',
  duration  = 8,
  borderWidth = 1,
}) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        aria-hidden="true"
        style={{
          position:     'absolute',
          inset:        0,
          borderRadius: 'inherit',
          padding:      borderWidth,
          // Conic-gradient rotates, masked to show only the border strip
          background:   `conic-gradient(from var(--bb-angle, 0deg), ${colorVia} 0%, ${colorFrom} 25%, ${colorVia} 50%)`,
          WebkitMask:   'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          animation:    `border-beam-spin ${duration}s linear infinite`,
          pointerEvents: 'none',
          zIndex:       0,
        }}
      />
    </>
  );
}
