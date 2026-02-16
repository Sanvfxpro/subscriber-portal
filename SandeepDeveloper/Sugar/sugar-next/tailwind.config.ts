import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                sugar: {
                    white: "#FAFAFA",
                    amber: "#D4AF37",
                    black: "#050505",
                    glass: "rgba(255, 255, 255, 0.1)",
                },
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)"],
                serif: ["var(--font-geist-mono)"], // Using mono as serif placeholder or will add real font
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
