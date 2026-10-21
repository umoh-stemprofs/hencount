import type { Config } from "tailwindcss";

// Tokens from stitch_hencount_accessible_login_screen/
//   clarity_calm_agricultural_standard/DESIGN.md (authoritative) and
// docs/design.md §1. Accent is HenCount ochre (#9A5B00).
//
// Type scale: DESIGN.md prohibits text below 16px anywhere, so every size is
// a named token rather than a magic class. Weight is baked into the token
// (body-lg is 400, body-lg-bold is 600) so a screen never has to guess.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F8FA",
        surface: "#FFFFFF",
        border: "#E4E7EC",
        // Interactive borders (inputs, secondary buttons) — one step stronger
        // than the structural card border.
        "border-strong": "#D0D5DD",
        text: "#101828",
        muted: "#475467",
        success: { DEFAULT: "#1B7F3B", bg: "#E8F5E9" },
        warning: { DEFAULT: "#B54708", bg: "#FEF0C7" },
        danger: { DEFAULT: "#B42318", bg: "#FEE4E2" },
        info: { DEFAULT: "#175CD3", bg: "#EFF8FF" },
        accent: "#9A5B00",
        "accent-dark": "#834D00",
      },
      borderRadius: {
        input: "10px",
        card: "12px",
        dialog: "16px",
        chip: "8px",
      },
      // DESIGN.md "Elevation & Depth": Level 1 for data cards, Level 2 for
      // dialogs and floating strips. No heavy shadows.
      boxShadow: {
        card: "0px 2px 4px rgba(16,24,40,.04), 0px 1px 2px rgba(16,24,40,.02)",
        elevated:
          "0px 12px 24px -4px rgba(16,24,40,.08), 0px 4px 8px -2px rgba(16,24,40,.04)",
        bar: "0px 1px 8px rgba(0,0,0,.04)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      // DESIGN.md "Typography" — the 16px floor is absolute.
      fontSize: {
        "display-stat": ["40px", { lineHeight: "48px", fontWeight: "700" }],
        "headline-lg": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-lg-bold": ["18px", { lineHeight: "28px", fontWeight: "600" }],
        "label-lg": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-base": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-base": ["16px", { lineHeight: "20px", fontWeight: "600" }],
      },
      // DESIGN.md "Layout & Spacing" — 8px baseline rhythm.
      spacing: {
        "space-xs": "0.5rem",
        "space-sm": "0.75rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
