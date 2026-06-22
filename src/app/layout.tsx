import type { Metadata } from 'next';
import './globals.css';
import LayoutWrapper from '../components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'Shiv Furniture Works – ERP Cockpit',
  description: 'Production-grade Mini ERP Orchestration Platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#060913] text-slate-100 min-h-screen">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
