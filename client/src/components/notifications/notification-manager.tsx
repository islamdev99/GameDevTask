import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Task } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAllTasks } from "@/lib/indexedDb";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useLocation } from "wouter";

const NOTIFICATION_CHECKED_AT = "notification-checked-at";

interface Notification {
  id: string;
  title: string;
  message: string;
  task: Task;
  createdAt: Date;
  isRead: boolean;
}

export default function NotificationManager() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const checkIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Check notifications on component mount
    checkNotifications();
    
    // Set interval to check tasks every 5 minutes
    checkIntervalRef.current = window.setInterval(checkNotifications, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Handle open/close of the popover
  useEffect(() => {
    if (isOpen) {
      markAllAsRead();
    }
  }, [isOpen]);

  const checkNotifications = async () => {
    try {
      const allTasks = await getAllTasks();
      const lastCheckedAt = localStorage.getItem(NOTIFICATION_CHECKED_AT);
      const lastCheckedDate = lastCheckedAt ? new Date(lastCheckedAt) : new Date(0);
      
      // Get upcoming task deadlines (today and tomorrow)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 2); // Include tomorrow fully
      
      // Filter tasks with deadlines today or tomorrow
      const upcomingTasks = allTasks.filter(task => {
        if (!task.deadline || task.status === "completed") return false;
        const taskDate = new Date(task.deadline);
        return taskDate >= today && taskDate < tomorrow;
      });

      // Sort by deadline (closest first)
      upcomingTasks.sort((a, b) => {
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        return 0;
      });

      // Create notification objects
      const newNotifications: Notification[] = upcomingTasks.map(task => {
        const taskDeadline = task.deadline ? new Date(task.deadline) : null;
        const isToday = taskDeadline && 
          taskDeadline.getDate() === today.getDate() &&
          taskDeadline.getMonth() === today.getMonth() &&
          taskDeadline.getFullYear() === today.getFullYear();
        
        let time = taskDeadline ? format(taskDeadline, "h:mm a") : "";
        let message = isToday 
          ? t("notifications.dueTodayAt", { time })
          : t("notifications.dueTomorrow", { time });
          
        return {
          id: `task-${task.id}-${task.deadline}`,
          title: task.title,
          message,
          task,
          createdAt: new Date(),
          isRead: false
        };
      });

      // Check if notifications should be shown
      const unreadCount = newNotifications.length;
      setNotificationCount(unreadCount);
      setNotifications(newNotifications);
      
      // Browser notification for really important deadlines (high priority due today)
      const highPriorityTodayTasks = upcomingTasks.filter(task => {
        if (!task.deadline || task.priority !== "high") return false;
        const taskDate = new Date(task.deadline);
        return (
          taskDate.getDate() === today.getDate() &&
          taskDate.getMonth() === today.getMonth() &&
          taskDate.getFullYear() === today.getFullYear()
        );
      });
      
      // Show browser notifications if permitted
      if (highPriorityTodayTasks.length > 0 && Notification.permission === "granted") {
        highPriorityTodayTasks.forEach(task => {
          showNotification(task);
        });
      } else if (highPriorityTodayTasks.length > 0 && Notification.permission !== "denied") {
        // Request permission
        Notification.requestPermission();
      }
      
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  const showNotification = (task: Task) => {
    // Only show if browser supports and permission granted
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }
    
    try {
      const taskDeadline = task.deadline ? new Date(task.deadline) : new Date();
      const timeString = format(taskDeadline, "h:mm a");
      
      new Notification(t("notifications.taskReminder"), {
        body: `${task.title} - ${t("notifications.dueTodayAt", { time: timeString })}`,
        icon: "/favicon.ico"
      });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  };

  const markAllAsRead = () => {
    localStorage.setItem(NOTIFICATION_CHECKED_AT, new Date().toISOString());
    setNotificationCount(0);
    setNotifications(prevNotifications => 
      prevNotifications.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const handleNotificationClick = (taskId: number) => {
    setIsOpen(false);
    navigate(`/tasks/${taskId}`);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t("notifications.justNow");
    if (diffInMinutes < 60) return t("notifications.minutesAgo", { minutes: diffInMinutes });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t("notifications.hoursAgo", { hours: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    return t("notifications.daysAgo", { days: diffInDays });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 max-h-96 overflow-y-auto p-0" 
        align="end"
      >
        <div className="p-4 border-b">
          <h3 className="font-semibold">{t("notifications.title")}</h3>
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {t("notifications.empty")}
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className="p-3 hover:bg-secondary/40 cursor-pointer transition-colors"
                onClick={() => handleNotificationClick(notification.task.id)}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                
                {notification.task.projectId && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {notification.task.projectName || `#${notification.task.projectId}`}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}