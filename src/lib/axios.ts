import axios from "axios";

// Create a reusable axios instance for the app
// Relative URLs will resolve against current origin in the browser
// You can set NEXT_PUBLIC_API_BASE to override.
const api = axios.create({
  baseURL:
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) ||
    undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
