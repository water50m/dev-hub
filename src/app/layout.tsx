import type { Metadata } from "next";
import { Kanit } from "next/font/google"; // ใช้ Kanit หรือ Prompt ก็ได้
import "./globals.css";

const kanit = Kanit({ 
  subsets: ["latin", "thai"], 
  weight: ["300", "400", "600"] 
});

export const metadata: Metadata = {
  title: "My Dev Hub",
  description: "Central Hub for all my projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={kanit.className}>{children}</body>
    </html>
  );
}