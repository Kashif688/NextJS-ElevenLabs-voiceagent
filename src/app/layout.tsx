import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { Toaster } from "react-hot-toast";
import ConvaiWidget from "@/components/ConvaiWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ElevenLabs Voice Agent CRM",
  description: "Manage leads and outbound AI voice calls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} bg-gray-50 flex min-h-screen text-slate-900`}>
        
        <Sidebar />

        {/* Main Content Wrapper */}
        <div className="ml-[260px] flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
          <Topbar />
          
          <main className="p-8 max-w-[1300px] w-full mx-auto">
            {children}
          </main>
        </div>

        <Toaster position="top-right" />
        <ConvaiWidget agentId={process.env.AGENT_ID} />
      </body>
    </html>
  );
}
