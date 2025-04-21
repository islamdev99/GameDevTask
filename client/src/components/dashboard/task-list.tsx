import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Task } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Filter, Plus } from "lucide-react";
import TaskItem from "./task-item";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TaskForm from "@/components/tasks/task-form";

export default function TaskList() {
  const { t } = useLanguage();
  const [openDialog, setOpenDialog] = useState(false);
  
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const getFilteredTasks = (status?: string) => {
    if (!tasks) return [];
    if (!status || status === "all") return tasks;
    return tasks.filter(task => task.status === status);
  };

  const renderEmptyState = (status: string) => {
    let icon = "";
    let message = "";

    switch (status) {
      case "upcoming":
        icon = "🗓️";
        message = t("tasks.noTasks");
        break;
      case "in-progress":
        icon = "⏳";
        message = t("tasks.noTasks");
        break;
      case "completed":
        icon = "✅";
        message = t("tasks.noTasks");
        break;
      default:
        icon = "📋";
        message = t("tasks.noTasks");
    }

    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <div className="text-6xl mb-3">{icon}</div>
        <p>{message}</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center p-4">
        <CardTitle className="text-lg font-semibold">{t("dashboard.recentTasks")}</CardTitle>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary px-3 py-1 rounded text-white flex items-center text-sm">
                <Plus className="h-4 w-4 mr-1" />
                <span>{t("tasks.addTask")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <TaskForm onSuccess={() => setOpenDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="all">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <TabsList className="flex h-auto bg-transparent border-b border-gray-200 dark:border-gray-700">
            <TabsTrigger
              value="all"
              className="px-4 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-0 shadow-none"
            >
              {t("tasks.all")}
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="px-4 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-0 shadow-none"
            >
              {t("tasks.upcoming")}
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              className="px-4 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-0 shadow-none"
            >
              {t("tasks.inProgress")}
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="px-4 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-0 shadow-none"
            >
              {t("tasks.completed")}
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="p-8 text-center">{t("app.loading")}</div>
            ) : getFilteredTasks().length === 0 ? (
              renderEmptyState("all")
            ) : (
              getFilteredTasks().map(task => (
                <TaskItem key={task.id} task={task} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-0">
            {isLoading ? (
              <div className="p-8 text-center">{t("app.loading")}</div>
            ) : getFilteredTasks("not-started").length === 0 ? (
              renderEmptyState("upcoming")
            ) : (
              getFilteredTasks("not-started").map(task => (
                <TaskItem key={task.id} task={task} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="in-progress" className="mt-0">
            {isLoading ? (
              <div className="p-8 text-center">{t("app.loading")}</div>
            ) : getFilteredTasks("in-progress").length === 0 ? (
              renderEmptyState("in-progress")
            ) : (
              getFilteredTasks("in-progress").map(task => (
                <TaskItem key={task.id} task={task} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            {isLoading ? (
              <div className="p-8 text-center">{t("app.loading")}</div>
            ) : getFilteredTasks("completed").length === 0 ? (
              renderEmptyState("completed")
            ) : (
              getFilteredTasks("completed").map(task => (
                <TaskItem key={task.id} task={task} />
              ))
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
