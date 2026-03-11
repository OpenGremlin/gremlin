/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",
        "app-border": "var(--color-border)",
        "border-subtle": "var(--color-border-subtle)",
        "text-primary": "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-faint": "var(--color-text-faint)",
        "input-bg": "var(--color-input-bg)",
        "input-border": "var(--color-input-border)",
        card: "var(--color-card)",
        overlay: "var(--color-overlay)",
        active: "var(--color-active)",
        "code-bg": "var(--color-code-bg)",
        "code-border": "var(--color-code-border)",
      },
    },
  },
  plugins: [],
};
