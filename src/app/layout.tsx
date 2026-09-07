import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../components/auth-provider'; // подключаем наш провайдер
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ZenFinance',
  description: 'Minimalist personal finance tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-zinc-950 text-zinc-50 antialiased`}>
        {/* 💡 Оборачиваем детей в контекст аутентификации */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
