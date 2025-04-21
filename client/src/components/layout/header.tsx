import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useState, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { Moon, Sun, Languages, Plus } from "lucide-react";
import { Link } from "wouter";
import NotificationManager from "@/components/notifications/notification-manager";

export default function Header() {
  const { t, toggleLanguage, language } = useLanguage();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isMobile = useMobile();

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.5 6.5h11v11h-11z" />
            <path d="M21 16a2 2 0 0 1-2 2" />
            <path d="M14 21a2 2 0 0 1-2 2" />
            <path d="M9 18a2 2 0 0 1-2-2" />
            <path d="M3 14a2 2 0 0 1 2-2" />
            <path d="M3 8a2 2 0 0 1 2-2" />
            <path d="M9 3a2 2 0 0 1 2 2" />
            <path d="M14 3a2 2 0 0 1 2 2" />
            <path d="M21 8a2 2 0 0 1-2 2" />
          </svg>
          <h1 className="text-xl font-bold">{t("app.name")}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationManager />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="flex items-center"
          >
            <Languages size={20} />
            <span className="ml-1 text-sm">{language.toUpperCase()}</span>
          </Button>

          {!isMobile && (
            <Button 
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center"
              onClick={() => window.location.href = "/projects"}
            >
              <Plus size={18} className="mr-1" />
              <span>{t("actions.newProject")}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
