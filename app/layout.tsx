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
