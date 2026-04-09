import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';

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
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23517da2" width="100" height="100" rx="20"/><text x="50" y="70" font-size="60" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">H</text></svg>',
        type: 'image/svg+xml',
      }
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={roboto.variable}>
      <body className="font-roboto antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
