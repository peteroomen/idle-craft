import React from 'react';

// Silkscreen is self-hosted via @fontsource (imported in providers.tsx), so builds need no network.
export default function Title() {
  return <h3 className="text-3xl sm:text-4xl text-white mb-1" style={{ fontFamily: 'Silkscreen, monospace', fontWeight: 700 }}>IRONBARK</h3>;
}
