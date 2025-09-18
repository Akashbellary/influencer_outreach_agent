// This page handles Google OAuth callbacks
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Process the OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");
    const userDataEncoded = urlParams.get("user_data");

    console.log("[v0] Google callback page - URL params:", {
      success,
      error,
      userDataEncoded: userDataEncoded ? "present" : "missing",
      fullUrl: window.location.href,
    });
    if (success === "true" && userDataEncoded) {
      try {
        console.log("[v0] Processing successful OAuth callback");
        // Store authentication status
        localStorage.setItem("campaignio:auth", "1");
        localStorage.removeItem("campaignio:disclaimer-ack");
        localStorage.setItem("campaignio:force-disclaimer", "1");

        // Store user data
        const userData = JSON.parse(decodeURIComponent(userDataEncoded));
        console.log("[v0] Storing user data:", userData);
        localStorage.setItem("campaignio:user-data", JSON.stringify(userData));

        // Redirect to home page
        console.log("[v0] Redirecting to /home");
        router.push("/home");
      } catch (err) {
        console.error("[v0] Error processing Google callback:", err);
        // Redirect to login with error message
        router.push("/?error=Failed to process authentication");
      }
    } else if (error) {
      console.log("[v0] OAuth error:", error);
      // Authentication failed, redirect to login page with error
      router.push(`/?error=${encodeURIComponent(error)}`);
    } else {
      console.log("[v0] No OAuth parameters found, redirecting to login");
      // No parameters means we just got here from Google OAuth
      // This shouldn't happen with our new flow, but redirect to login as fallback
      router.push("/");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">
          Processing Google Login...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}
