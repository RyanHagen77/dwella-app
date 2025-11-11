/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E5E7EB",
        text: "#0F172A",
        subtext: "#6B7280",
        accent: "#2563EB",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",

        // brandy oranges/yellows for CTAs/alerts (used in glass classes)
        brand: {
          orange: "#ea6a1a",
          orangeDark: "#d85b11",
          amber: "#f59e0b",
        },
      },
      borderRadius: { sm: "8px", md: "12px", lg: "16px", "2xl": "1rem" },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04)",
        glass: "0 8px 30px rgba(0,0,0,0.12)",
        glassSoft: "0 6px 20px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};