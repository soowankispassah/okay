"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Invalid verification link");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Verification failed");
        }

        setStatus("success");
        // Redirect to profile completion after a short delay
        setTimeout(() => {
          router.push("/auth/complete-profile");
        }, 2000);
      } catch (error: any) {
        setStatus("error");
        setError(error.message);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {status === "loading" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Verifying your email...</h2>
            <p className="mt-2 text-gray-600">Please wait a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600">
              Email verified successfully!
            </h2>
            <p className="mt-2 text-gray-600">
              Redirecting to complete your profile...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">
              Verification failed
            </h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="mt-4 text-indigo-600 hover:text-indigo-500"
            >
              Return to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 