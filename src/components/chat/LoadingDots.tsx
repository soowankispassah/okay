'use client';

export default function LoadingDots() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]"></div>
    </div>
  );
}
