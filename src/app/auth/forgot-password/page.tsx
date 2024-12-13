import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Your App Name",
  description: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#101010] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-10">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-black text-xl font-bold">K</span>
          </div>
          <h2 className="text-center text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Reset your password
          </h2>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
} 