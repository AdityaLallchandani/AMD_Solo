// src/app/layout.jsx
// Wraps the entire app with AuthProvider so every page has access to auth state.
import { AuthProvider } from "@/context/AuthContext";
import { Toaster }      from "react-hot-toast";
import "./styles/globals.css";

export const metadata = {
  title:       "FuelTrack – Food & Health Tracker",
  description: "Track your nutrition, macros, and fitness goals in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">
        <AuthProvider>
          {children}
          {/* Global toast notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1f2937",
                color: "#f9fafb",
                borderRadius: "12px",
                border: "1px solid #374151",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}