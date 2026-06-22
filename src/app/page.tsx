'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#060913] text-slate-400 font-mono text-sm">
      <span>Redirecting to cockpit...</span>
    </div>
  );
}
