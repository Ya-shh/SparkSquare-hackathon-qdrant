import "./globals.css";
import type { Metadata } from "next";
import { Inter, Source_Sans_3, Merriweather } from "next/font/google";
import Navbar from "@/components/navigation/navbar";
import { FiGithub, FiTwitter, FiMail } from "react-icons/fi";
import { Providers } from "@/components/Providers";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { AOSProvider } from "@/components/AOSProvider";
import { CursorTracker } from "@/components/CursorTracker";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "SparkSquare | Neural Discussion Platform",
  description: "Connect minds, share ideas, and build knowledge networks in a vibrant neural community.",
  icons: {
    icon: '/sparksquare-icon.svg',
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${inter.variable} ${sourceSans.variable} ${merriweather.variable} min-h-screen bg-gray-950 text-foreground font-sans`}>
        <CursorTracker />
        <Providers>
          <AOSProvider>
            <AnimatedBackground />
            <div className="flex flex-col min-h-screen relative z-0">
              <Navbar />
              <main className="flex-1">{children}</main>
              <footer className="border-t border-gray-800 py-8 mt-12">
                <div className="container mx-auto px-4 sm:px-6">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                      <h2 className="text-xl font-bold text-white">SparkSquare</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        Neural networks for human knowledge.
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        aria-label="GitHub"
                      >
                        <FiGithub className="h-5 w-5" />
                      </a>
                      <a 
                        href="https://twitter.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        aria-label="Twitter"
                      >
                        <FiTwitter className="h-5 w-5" />
                      </a>
                      <a 
                        href="mailto:contact@sparksquare.com" 
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        aria-label="Email"
                      >
                        <FiMail className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                  <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400">
                    <p>© {new Date().getFullYear()} SparkSquare. All rights reserved.</p>
                  </div>
                </div>
              </footer>
            </div>
          </AOSProvider>
        </Providers>
      </body>
    </html>
  );
}
