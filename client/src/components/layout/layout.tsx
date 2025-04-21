import { ReactNode } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { I18nProvider } from "@/providers/i18n-provider";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex flex-1">
          <Sidebar />
          
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            {children}
          </main>
        </div>
        
        <MobileNav />
      </div>
    </I18nProvider>
  );
}
