import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Task } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Clock, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SubtaskList from "../tasks/subtask-list";

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const { t } = useLanguage();
  const [showSubtasks, setShowSubtasks] = useState(false);

  const updateTaskMutation = useMutation({
    mutationFn: (completed: boolean) => {
      return apiRequest("PUT", `/api/tasks/${task.id}`, {
        status: completed ? "completed" : "not-started",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
    },
  });

  const handleCheckboxChange = (checked: boolean) => {
    updateTaskMutation.mutate(checked);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
      case "low":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "programming":
        return "bg-primary bg-opacity-10 text-primary";
      case "design":
        return "bg-secondary bg-opacity-10 text-secondary";
      case "audio":
        return "bg-accent bg-opacity-10 text-accent";
      case "marketing":
        return "bg-yellow-500 bg-opacity-10 text-yellow-500";
      default:
        return "bg-gray-500 bg-opacity-10 text-gray-500";
    }
  };

  const getPriorityBorderClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500";
      case "medium":
        return "border-l-4 border-yellow-500";
      case "low":
        return "border-l-4 border-green-500";
      default:
        return "";
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMM dd");
    }
  };

  return (
    <Collapsible 
      open={showSubtasks} 
      onOpenChange={setShowSubtasks}
      className={cn(
        "border-b border-gray-200 dark:border-gray-700",
        getPriorityBorderClass(task.priority)
      )}
    >
      <div 
        className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div className="mr-3">
          <Checkbox 
            checked={task.status === "completed"} 
            onCheckedChange={handleCheckboxChange}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <h4 className={cn(
              "font-medium text-gray-900 dark:text-gray-100",
              task.status === "completed" && "line-through"
            )}>
              {task.title}
            </h4>
            <span className={cn(
              "ml-2 text-xs px-2 py-1 rounded",
              getCategoryColor(task.category)
            )}>
              {t(`tasks.categories.${task.category}`)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
        </div>
        <div className="ml-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span className={cn(
            "rounded-full px-2 py-1 text-xs mr-3",
            getPriorityColor(task.priority)
          )}>
            {t(`tasks.priorities.${task.priority}`)}
          </span>
          {task.deadline && (
            <div className="flex items-center mr-3">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatDate(new Date(task.deadline))}</span>
            </div>
          )}
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2"
            >
              <List className="h-4 w-4 mr-1" />
              {showSubtasks ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent>
        <div className="px-12 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          <SubtaskList taskId={task.id} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
