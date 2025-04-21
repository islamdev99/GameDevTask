import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { LayoutDashboard, Folder, ClipboardList, Settings, Plus, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProjectForm from "@/components/projects/project-form";

export default function MobileNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    {
      href: "/",
      label: t("navigation.dashboard"),
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/projects",
      label: t("navigation.projects"),
      icon: <Folder className="h-5 w-5" />,
    },
    {
      href: "/tasks",
      label: t("navigation.tasks"),
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      href: "/timeline",
      label: t("navigation.timeline"),
      icon: <CalendarRange className="h-5 w-5" />,
    },
    {
      href: "/settings",
      label: t("navigation.settings"),
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center p-3">
      {navItems.map((item, index) => (
        <div 
          key={item.href}
          className={cn(
            "flex flex-col items-center cursor-pointer",
            location === item.href
              ? "text-primary"
              : "text-gray-500 dark:text-gray-400"
          )}
          onClick={() => {
            window.location.href = item.href;
          }}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </div>
      ))}

      <Dialog>
        <DialogTrigger asChild>
          <Button 
            className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg relative -top-5"
          >
            <Plus size={24} />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{t("projects.newProject")}</DialogTitle>
          <ProjectForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
