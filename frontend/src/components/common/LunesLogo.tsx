import React from 'react';

interface LunesLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export const LunesLogo: React.FC<LunesLogoProps> = ({ size = 24, className, color = '#26D07C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#lunes-clip)">
      <path
        d="M24 11.9768C24.0047 8.87696 22.8064 5.89627 20.6574 3.6623C18.5084 1.42833 15.5764 0.115418 12.4788 0V1.53691C15.171 1.65995 17.7123 2.81606 19.574 4.76479C21.4357 6.71353 22.4746 9.3049 22.4746 12C22.4746 14.6951 21.4357 17.2865 19.574 19.2352C17.7123 21.1839 15.171 22.34 12.4788 22.4631V24C15.5785 23.8669 18.5072 22.5421 20.6538 20.302C22.8004 18.0619 23.9992 15.0794 24 11.9768Z"
        fill={color}
      />
      <path
        d="M1.47163e-05 11.9768C-0.00440025 15.0964 1.20938 18.0945 3.38283 20.3324C5.55628 22.5703 8.51761 23.8712 11.636 23.9579V0C8.51783 0.0851205 5.55623 1.38488 3.38256 3.6222C1.2089 5.85952 -0.00487495 8.85741 1.47163e-05 11.9768Z"
        fill={color}
      />
    </g>
    <defs>
      <clipPath id="lunes-clip">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default LunesLogo;
