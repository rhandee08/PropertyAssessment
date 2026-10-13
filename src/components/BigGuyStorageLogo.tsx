import React from 'react';

interface BigGuyStorageLogoProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const BigGuyStorageLogo: React.FC<BigGuyStorageLogoProps> = ({
  className = '',
  width = '2in',
  height = '1in',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 560 250"
      style={{ width, height }}
      className={`select-none shrink-0 overflow-visible ${className}`}
      aria-label="Big Guy Storage"
      role="img"
    >
      {/* 3D Stacked Storage Boxes */}
      <g id="storage-boxes">
        {/* Box 1: Bottom Left Box */}
        <g transform="translate(10, 65)">
          {/* Top Face */}
          <polygon
            points="58,0 116,30 58,60 0,30"
            fill="#9bcb38"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Top flap seam line */}
          <line x1="58" y1="0" x2="58" y2="60" stroke="#ffffff" strokeWidth="2.5" />
          {/* Front Left Face */}
          <polygon
            points="0,30 58,60 58,130 0,100"
            fill="#86b528"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Front Right Face */}
          <polygon
            points="58,60 116,30 116,100 58,130"
            fill="#739f1e"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Handle / Tape Tab on Front-Left Face */}
          <rect
            x="20"
            y="42"
            width="16"
            height="32"
            rx="2"
            fill="#ffffff"
          />
          <rect
            x="24"
            y="52"
            width="8"
            height="14"
            rx="1"
            fill="#86b528"
          />
        </g>

        {/* Box 2: Bottom Right Box */}
        <g transform="translate(78, 100)">
          {/* Top Face */}
          <polygon
            points="58,0 116,30 58,60 0,30"
            fill="#9bcb38"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Top flap seam line */}
          <line x1="58" y1="0" x2="58" y2="60" stroke="#ffffff" strokeWidth="2.5" />
          {/* Front Left Face */}
          <polygon
            points="0,30 58,60 58,130 0,100"
            fill="#86b528"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Front Right Face */}
          <polygon
            points="58,60 116,30 116,100 58,130"
            fill="#739f1e"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Handle / Tape Tab on Front-Left Face */}
          <rect
            x="20"
            y="42"
            width="16"
            height="32"
            rx="2"
            fill="#ffffff"
          />
          <rect
            x="24"
            y="52"
            width="8"
            height="14"
            rx="1"
            fill="#86b528"
          />
        </g>

        {/* Box 3: Top Box */}
        <g transform="translate(44, 8)">
          {/* Top Face */}
          <polygon
            points="58,0 116,30 58,60 0,30"
            fill="#9bcb38"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Top flap seam line */}
          <line x1="58" y1="0" x2="58" y2="60" stroke="#ffffff" strokeWidth="2.5" />
          {/* Front Left Face */}
          <polygon
            points="0,30 58,60 58,130 0,100"
            fill="#86b528"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Front Right Face */}
          <polygon
            points="58,60 116,30 116,100 58,130"
            fill="#739f1e"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Handle / Tape Tab on Front-Left Face */}
          <rect
            x="20"
            y="42"
            width="16"
            height="32"
            rx="2"
            fill="#ffffff"
          />
          <rect
            x="24"
            y="52"
            width="8"
            height="14"
            rx="1"
            fill="#86b528"
          />
        </g>
      </g>

      {/* Brand Text Section */}
      <g transform="translate(216, 20)">
        {/* BIG in Lime Green */}
        <text
          x="0"
          y="108"
          fontFamily="'Arial Black', 'Impact', 'Trebuchet MS', sans-serif"
          fontWeight="900"
          fontSize="100"
          fill="#9bcb38"
          letterSpacing="-2"
        >
          BIG
        </text>

        {/* GUY in Black */}
        <text
          x="154"
          y="108"
          fontFamily="'Arial Black', 'Impact', 'Trebuchet MS', sans-serif"
          fontWeight="900"
          fontSize="100"
          fill="#000000"
          letterSpacing="-2"
        >
          GUY
        </text>

        {/* Black Horizontal Banner */}
        <rect
          x="0"
          y="126"
          width="320"
          height="48"
          fill="#000000"
          rx="3"
        />

        {/* STORAGE in Bold Spaced White */}
        <text
          x="160"
          y="159"
          fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontSize="23"
          fill="#ffffff"
          textAnchor="middle"
          letterSpacing="13"
        >
          STORAGE
        </text>
      </g>
    </svg>
  );
};
export default BigGuyStorageLogo;
