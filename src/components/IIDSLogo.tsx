import React from 'react';

export default function IIDSLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 680 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="90" fontFamily="Georgia, 'Times New Roman', serif" fontSize="110" fill="#4B5563">IIDS</text>
      <rect x="260" y="15" width="6" height="85" fill="#DC2626" />
      <text x="290" y="45" fontFamily="Georgia, 'Times New Roman', serif" fontSize="30" fill="#4B5563">Institute for Integrated</text>
      <text x="290" y="90" fontFamily="Georgia, 'Times New Roman', serif" fontSize="30" fill="#4B5563">Development Studies</text>
      <circle cx="585" cy="80" r="6" fill="#DC2626" />
      <text x="605" y="90" fontFamily="Georgia, 'Times New Roman', serif" fontSize="30" fill="#4B5563">1979</text>
    </svg>
  );
}
