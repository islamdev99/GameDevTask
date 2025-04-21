import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { getAllTasks } from "@/lib/indexedDb";
import { Task } from "@shared/schema";
import { X, Calendar, Pin, PinOff, Check, ArrowUpCircle, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const WIDGET_VISIBLE_KEY = "widget-visible";
const PINNED_TASKS_KEY = "widget-pinned-tasks";

export default function TaskWidget() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [pinnedTaskIds, setPinnedTaskIds] = useState<number[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    // Load saved visibility state
    const savedVisibility = localStorage.getItem(WIDGET_VISIBLE_KEY) !== "false";
    setIsVisible(savedVisibility);
    
    // Load pinned tasks from local storage
    const savedPinnedTasks = localStorage.getItem(PINNED_TASKS_KEY);
    if (savedPinnedTasks) {
      try {
        setPinnedTaskIds(JSON.parse(savedPinnedTasks));
      } catch (error) {
        console.error("Error parsing pinned tasks:", error);
        setPinnedTaskIds([]);
      }
    }
    
    loadTodayTasks();
    
    // Refresh tasks every 5 minutes
    const intervalId = setInterval(loadTodayTasks, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const loadTodayTasks = async () => {
    try {
      const allTasks = await getAllTasks();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get tasks due today or pinned tasks
      const filtered = allTasks.filter(task => {
        // Include pinned tasks regardless of due date
        if (pinnedTaskIds.includes(task.id)) return true;
        
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        return taskDate >= today && taskDate < tomorrow;
      });
      
      // Sort by pinned status first, then by priority and deadline
      const sorted = filtered.sort((a, b) => {
        // Pinned tasks come first
        const aPinned = pinnedTaskIds.includes(a.id);
        const bPinned = pinnedTaskIds.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        // Then by completion status
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        
        // Then by priority
        const priorities = { high: 0, medium: 1, low: 2 };
        const aPriority = priorities[a.priority as keyof typeof priorities] || 999;
        const bPriority = priorities[b.priority as keyof typeof priorities] || 999;
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Then by deadline
        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        
        return 0;
      });
      
      setTodayTasks(sorted);
    } catch (error) {
      console.error("Error loading today's tasks:", error);
    }
  };

  const toggleWidget = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem(WIDGET_VISIBLE_KEY, newVisibility.toString());
  };

  const toggleTaskPin = (taskId: number) => {
    const isPinned = pinnedTaskIds.includes(taskId);
    let newPinnedTaskIds;
    
    if (isPinned) {
      // Remove from pinned tasks
      newPinnedTaskIds = pinnedTaskIds.filter(id => id !== taskId);
    } else {
      // Add to pinned tasks
      newPinnedTaskIds = [...pinnedTaskIds, taskId];
    }
    
    setPinnedTaskIds(newPinnedTaskIds);
    localStorage.setItem(PINNED_TASKS_KEY, JSON.stringify(newPinnedTaskIds));
    
    // Reload tasks to update order
    loadTodayTasks();
  };

  const goToTask = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  if (!isVisible) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-amber-500";
      case "low": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card className="fixed bottom-4 end-4 shadow-lg w-80 z-50">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center">
          <Calendar className="h-4 w-4 me-2" />
          {t("widget.todayTasks")}
        </CardTitle>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4 transform rotate-180" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={toggleWidget}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-3 max-h-80 overflow-y-auto">
          {todayTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t("widget.emptyWidget")}
            </div>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map(task => (
                <li 
                  key={task.id} 
                  className={`flex items-start p-2 border rounded-md ${
                    task.status === "completed" ? "opacity-70 bg-secondary/40" : "hover:bg-secondary/40"
                  } transition-colors group cursor-pointer`}
                  onClick={() => goToTask(task.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {task.status === "completed" ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <CircleAlert size={16} className={getPriorityColor(task.priority)} />
                    )}
                  </div>
                  <div className="ms-2 flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === "completed" ? "line-through" : ""}`}>
                      {task.title}
                    </p>
                    {task.deadline && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.deadline), "h:mm a")}
                      </p>
                    )}
                    {task.projectId && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {/* Note: In a real app, we'd fetch the project name */}
                        {`#${task.projectId}`}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 ms-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskPin(task.id);
                    }}
                    title={pinnedTaskIds.includes(task.id) ? t("widget.unpinTask") : t("widget.pinTask")}
                  >
                    {pinnedTaskIds.includes(task.id) ? (
                      <Pin size={14} className="fill-primary text-primary" />
                    ) : (
                      <PinOff size={14} />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}