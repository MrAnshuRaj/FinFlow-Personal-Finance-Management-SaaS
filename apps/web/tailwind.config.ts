import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#152126", mint: "#20b486", mist: "#f4f7f6" }, boxShadow: { card: "0 12px 32px rgba(21,33,38,.07)" } } }, plugins: [] } satisfies Config;
