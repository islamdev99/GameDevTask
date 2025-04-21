import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TaskItem from "@/components/dashboard/task-item";
import TaskForm from "@/components/tasks/task-form";
import { Filter, Plus, Search } from "lucide-react";

export default function Tasks() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const filteredTasks = tasks?.filter((task) => {
    // Filter by search term
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    
    // Filter by priority
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    // Filter by category
    const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
    
    // Filter by status (tab)
    const matchesStatus = activeTab === "all" || task.status === activeTab;
    
    return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
  });
  
  // Find project name for task
  const getProjectName = (projectId: number | null) => {
    if (!projectId || !projects) return "No Project";
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t("tasks.title")}</h2>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t("actions.newTask")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <TaskForm onSuccess={() => setOpenDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center p-4">
          <CardTitle className="text-lg font-semibold">{t("tasks.title")}</CardTitle>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("actions.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={priorityFilter}
              onValueChange={setPriorityFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t("tasks.priority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">{t("tasks.priorities.high")}</SelectItem>
                <SelectItem value="medium">{t("tasks.priorities.medium")}</SelectItem>
                <SelectItem value="low">{t("tasks.priorities.low")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t("tasks.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="programming">{t("tasks.categories.programming")}</SelectItem>
                <SelectItem value="design">{t("tasks.categories.design")}</SelectItem>
                <SelectItem value="audio">{t("tasks.categories.audio")}</SelectItem>
                <SelectItem value="marketing">{t("tasks.categories.marketing")}</SelectItem>
                <SelectItem value="other">{t("tasks.categories.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      
        <Tabs 
          defaultValue="all" 
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <TabsList className="flex h-auto bg-transparent border-b border-gray-200 dark:border-gray-700">
              <TabsTrigger
                value="all"
                className="px-4 py-3 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-0 shadow-none"
              >
                {t("tasks.all")}
              </TabsTrigger>
              <TabsTrigger
                value="not-started"
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
              ) : filteredTasks && filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <div key={task.id} className="border-b border-gray-200 dark:border-gray-700">
                    <TaskItem task={task} />
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <span>Project: {getProjectName(task.projectId)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-3">📋</div>
                  <p>{t("tasks.noTasks")}</p>
                </div>
              )}
            </TabsContent>
            
            {/* The other tab contents will be shown through the filtering mechanism */}
            <TabsContent value="not-started" className="mt-0">
              {/* Content shown via filtering */}
            </TabsContent>
            <TabsContent value="in-progress" className="mt-0">
              {/* Content shown via filtering */}
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              {/* Content shown via filtering */}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
