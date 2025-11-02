// src/constants/colors.js

// Using 400-level for fills as it's softer and matches the 100-level badges better
export const RISK_COLORS = {
  LOW: {
    badge: "bg-green-500 text-white",
    fill: "bg-green-500",
    chart: "#22C55E", // Tailwind green-500
  },
  MEDIUM: {
    badge: "bg-yellow-500 text-black",
    fill: "bg-yellow-500",
    chart: "#EAB308", // Tailwind yellow-500
  },
  HIGH: {
    badge: "bg-red-500 text-white",
    fill: "bg-red-500",
    chart: "#EF4444", // Tailwind red-500
  },
  UNKNOWN: {
    badge: "bg-gray-500 text-white",
    fill: "bg-gray-500",
    chart: "#6B7280", // Tailwind gray-500
  },
};
