"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

const getErrorMessage = (error: string | null) => {
  switch (error) {
    case "OAuthCreateAccount":
      return "There was a problem creating your account. Please try again.";
    case "OAuthCallback":
      return "There was a problem with the OAuth callback. Please try again.";
    case "OAuthSignin":
      return "There was a problem signing in with OAuth. Please try again.";
    case "EmailSignin":
      return "There was a problem signing in with email. Please try again.";
    case "CredentialsSignin":
      return "Invalid email or password. Please try again.";
    default:
      return "An error occurred. Please try again.";
  }
};

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-red-600">
            {getErrorMessage(error)}
          </p>
          <div className="mt-4 text-center">
            <Link
              href="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 