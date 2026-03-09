import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Saurashtra Connect',
  description: 'Community platform preserving the Saurashtra language.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #e5e7eb',
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
              },
            }}
          />
          <Navbar />
          <main className="flex-1 flex flex-col w-full relative z-0">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
