/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0ea5e9", // Electric blue/cyan
        secondary: "#14b8a6", // Teal
        background: "#f9fafb", // Soft off-white for light mode
        card: "#ffffff",
        text: "#111827",
        muted: "#6b7280",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        darkBg: "#111827", // Very dark charcoal
        darkCard: "#1f2937",
        darkText: "#f9fafb",
      }
    },
  },
  plugins: [],
}
