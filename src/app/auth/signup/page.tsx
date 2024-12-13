import SignupForm from "@/components/auth/SignupForm";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up | Your App Name",
  description: "Create a new account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#101010] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-10">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-black text-xl font-bold">K</span>
          </div>
          <h2 className="text-center text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Create your account
          </h2>
        </div>

        <SignupForm />

        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-black hover:text-gray-800 dark:text-white dark:hover:text-gray-200"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
} 