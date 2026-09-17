import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { StoreProvider } from "@/components/provider/store-provider";
import { AuthProvider } from "@/components/provider/auth-provider";
import { ToastContainer } from "react-toastify";

const beVietnamPro = Be_Vietnam_Pro({
   variable: "--font-sans",
   subsets: ["latin", "vietnamese"],
   weight: ["300", "400", "500", "600", "700"],
   display: "swap",
});

const geistMono = Geist_Mono({
   variable: "--font-geist-mono",
   subsets: ["latin"],
});

export const metadata: Metadata = {
   title: "VNDoctor - Nền tảng quản lý bệnh mạn tính",
   description: "Nền tảng quản lý bệnh mạn tính chuyên nghiệp.",
   icons: {
      icon: "/tmt/logo-navi-browser.png",
      apple: "/tmt/logo-navi-browser.png",
   },
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html
         lang="vi"
         className={`${beVietnamPro.variable} ${geistMono.variable}`}
      >
         <body className="font-sans antialiased">
            <StoreProvider>
               <AuthProvider>{children}</AuthProvider>
            </StoreProvider>
            <ToastContainer
               position="top-right"
               autoClose={3000}
               hideProgressBar={false}
               newestOnTop={true}
               closeOnClick
               rtl={false}
               theme="colored"
               pauseOnFocusLoss
               draggable
               pauseOnHover
            />
         </body>
      </html>
   );
}
