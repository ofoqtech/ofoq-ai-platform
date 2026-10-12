import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "Ofoq AI Platform",
  description: "منصة الذكاء الاصطناعي الداخلية لفريق أفق تك",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans bg-surface text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
