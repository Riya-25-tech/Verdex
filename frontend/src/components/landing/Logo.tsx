import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3">
      {/* Transparent Box with Clean Black Outline */}
      <span className="relative grid h-10 w-10 place-items-center rounded-xl border-2 border-neutral-900 bg-transparent p-1 shadow-sm transition-all duration-300 group-hover:border-amber-600 group-hover:scale-105">
        <svg
          viewBox="0 0 48 48"
          className="h-8 w-8 filter drop-shadow-[0_1px_3px_rgba(217,119,6,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Deep Metallic Liquid Gold with High-Gloss Specular Flash */}
            <linearGradient id="goldDeepShine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="18%" stopColor="#B45309" />
              <stop offset="38%" stopColor="#FFFDF0" />
              <stop offset="55%" stopColor="#F59E0B" />
              <stop offset="82%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>

            {/* Radiant Specular Gold */}
            <linearGradient id="goldRichSpecular" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="25%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="75%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#5B2205" />
            </linearGradient>

            {/* Obsidian Metallic Black */}
            <linearGradient id="obsidianBlack" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#292524" />
              <stop offset="40%" stopColor="#171717" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>

            {/* Golden Mirror Core Spark */}
            <linearGradient id="goldGlow" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
          </defs>

          {/* === LEFT ARM: Bold Obsidian Black Blade with Broad Gold Bevel === */}
          <path
            d="M8 8C8 7 9 6.2 10.2 6.2H15.5C16.4 6.2 17.1 6.8 17.4 7.6L24.2 32.5L20.5 38.5C20 39.2 19 39.4 18.2 38.8L7.5 10.5C7.2 9.7 7.5 8.7 8 8Z"
            fill="url(#obsidianBlack)"
            stroke="#57534E"
            strokeWidth="0.8"
          />

          {/* Left Arm Bold Shiny Gold Inset */}
          <path
            d="M12 6.8H15.5C16.2 6.8 16.7 7.2 16.9 7.8L23 29L20.8 33L12 6.8Z"
            fill="url(#goldDeepShine)"
          />

          {/* === RIGHT ARM: 3 Bold, Distinct Stretched Feather Plumes === */}
          
          {/* Feather 1 (Top Primary Flight Feather - Stretched High) */}
          <path
            d="M23 35C25 25 31 13 44 6C40 12 34 18 28.5 24C25.8 27.5 24.2 31.5 23 35Z"
            fill="url(#goldDeepShine)"
            stroke="#171717"
            strokeWidth="0.8"
          />

          {/* Feather 2 (Mid Stepped Feather - Broad and Punchy) */}
          <path
            d="M23.5 36C26 29 32 20 40 16C36 21 31 27 26.5 32L23.5 36Z"
            fill="url(#goldRichSpecular)"
            stroke="#171717"
            strokeWidth="0.8"
          />

          {/* Feather 3 (Lower Stepped Feather - Broad Base Plume) */}
          <path
            d="M24 37C26.5 32 31.5 26 35 24.5C32 29 28 33.5 25 37.5L24 37Z"
            fill="url(#goldDeepShine)"
            stroke="#171717"
            strokeWidth="0.8"
          />

          {/* Center Apex Diamond Spark */}
          <path
            d="M21.5 37.5L24 34.5L26.5 37.5L24 40.5L21.5 37.5Z"
            fill="url(#goldGlow)"
          />
        </svg>
      </span>
      <span className="text-xl font-bold tracking-tight text-[var(--text)]">Verdex</span>
    </Link>
  );
}
