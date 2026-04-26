import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
// import MegaStorageProvider from '@/components/MegaStorageProvider'; // Отключено: MEGA требует платный аккаунт

const roboto = Roboto({
  weight: ['400', '500'],
  subsets: ['cyrillic', 'latin'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'HouseGram Web',
  description: 'HouseGram Web - Modern Chat Application',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%2342a5f5;stop-opacity:1"/><stop offset="100%" style="stop-color:%231976d2;stop-opacity:1"/></linearGradient></defs><rect fill="url(%23grad)" width="100" height="100" rx="22"/><path d="M50 25 L70 40 L70 70 L30 70 L30 40 Z" fill="white"/><rect x="42" y="52" width="16" height="18" fill="url(%23grad)"/><circle cx="50" cy="35" r="3" fill="white"/></svg>',
        type: 'image/svg+xml',
      }
    ],
    apple: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%2342a5f5;stop-opacity:1"/><stop offset="100%" style="stop-color:%231976d2;stop-opacity:1"/></linearGradient></defs><rect fill="url(%23grad)" width="100" height="100" rx="22"/><path d="M50 25 L70 40 L70 70 L30 70 L30 40 Z" fill="white"/><rect x="42" y="52" width="16" height="18" fill="url(%23grad)"/><circle cx="50" cy="35" r="3" fill="white"/></svg>',
        type: 'image/svg+xml',
      }
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#517da2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HouseGram',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={roboto.variable} suppressHydrationWarning>
      <body className="font-roboto antialiased bg-white text-black dark:bg-[#0f0f0f] dark:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
