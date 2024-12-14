'use client';

import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const deleted = searchParams.get('deleted');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#101010] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-10">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-black text-xl font-bold">K</span>
          </div>
          <h2 className="text-center text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Welcome back
          </h2>
          {deleted && (
            <div className="w-full px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 text-center">
              Your account has been successfully deleted
            </div>
          )}
        </div>

        <LoginForm />

        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-black hover:text-gray-800 dark:text-white dark:hover:text-gray-200"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 