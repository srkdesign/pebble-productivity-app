export const MenuIcon = ({ size = 24, color = "#000000" }) => {
  return (
    <svg
      fill="none"
      height={size}
      viewBox={`0 0 24 24`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_4418_9850)">
        <path
          d="M3 7H21"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <path
          d="M3 12H21"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <path
          d="M3 17H21"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </g>
      <defs>
        <clipPath id="clip0_4418_9850">
          <rect fill="white" height="24" width="24" />
        </clipPath>
      </defs>
    </svg>
  );
};
