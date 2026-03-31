/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Firebase Storage and Google profile picture domains
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Server-side GCP packages must not be bundled for the browser
  serverExternalPackages: ["@google-cloud/vertexai", "@google-cloud/vision", "@google-cloud/storage"],
};

export default nextConfig;