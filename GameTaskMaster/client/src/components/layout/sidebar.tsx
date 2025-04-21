import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { LayoutDashboard, Folder, ClipboardList, BarChart3, Save, Settings, Timer, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    {
      href: "/",
      label: t("navigation.dashboard"),
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
    },
    {
      href: "/projects",
      label: t("navigation.projects"),
      icon: <Folder className="mr-3 h-5 w-5" />,
    },
    {
      href: "/tasks",
      label: t("navigation.tasks"),
      icon: <ClipboardList className="mr-3 h-5 w-5" />,
    },
    {
      href: "/timeline",
      label: t("navigation.timeline"),
      icon: <CalendarRange className="mr-3 h-5 w-5" />,
    },
    {
      href: "/statistics",
      label: t("navigation.statistics"),
      icon: <BarChart3 className="mr-3 h-5 w-5" />,
    },
    {
      href: "/pomodoro",
      label: t("navigation.pomodoro"),
      icon: <Timer className="mr-3 h-5 w-5" />,
    },
    {
      href: "/backup",
      label: t("navigation.backup"),
      icon: <Save className="mr-3 h-5 w-5" />,
    },
    {
      href: "/settings",
      label: t("navigation.settings"),
      icon: <Settings className="mr-3 h-5 w-5" />,
    },
  ];

  return (
    <aside className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <div
                className={cn(
                  "flex items-center p-3 rounded-lg cursor-pointer",
                  location === item.href
                    ? "bg-primary bg-opacity-10 text-primary dark:text-primary-light"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                onClick={() => {
                  window.location.href = item.href;
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
