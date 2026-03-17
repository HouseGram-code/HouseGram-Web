import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatProvider } from '@/context/ChatContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-roboto' });

export const metadata: Metadata = {
  title: 'HouseGram',
  description: 'A modern chat application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ErrorBoundary>
          <ChatProvider>
            {children}
          </ChatProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
