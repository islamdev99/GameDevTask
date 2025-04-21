import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Project, Task } from "@shared/schema";

export default function Statistics() {
  const { t } = useLanguage();
  
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/statistics"],
  });
  
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const isLoading = statsLoading || projectsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-6">{t("statistics.title")}</h2>
        <p>{t("app.loading")}</p>
      </div>
    );
  }

  if (!statistics || !projects || !tasks) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-6">{t("statistics.title")}</h2>
        <p>Failed to load statistics</p>
      </div>
    );
  }

  // Prepare data for task status pie chart
  const taskStatusData = [
    { name: t("tasks.statuses.notStarted"), value: tasks.filter(t => t.status === "not-started").length, color: "#9E9E9E" },
    { name: t("tasks.statuses.inProgress"), value: tasks.filter(t => t.status === "in-progress").length, color: "#FFC107" },
    { name: t("tasks.statuses.completed"), value: tasks.filter(t => t.status === "completed").length, color: "#4CAF50" },
  ];

  // Prepare data for task priority pie chart
  const taskPriorityData = [
    { name: t("tasks.priorities.high"), value: tasks.filter(t => t.priority === "high").length, color: "#F44336" },
    { name: t("tasks.priorities.medium"), value: tasks.filter(t => t.priority === "medium").length, color: "#FFC107" },
    { name: t("tasks.priorities.low"), value: tasks.filter(t => t.priority === "low").length, color: "#4CAF50" },
  ];

  // Prepare data for category pie chart
  const categoryData = Object.entries(statistics.tasksByCategory).map(([category, count]) => ({
    name: t(`tasks.categories.${category}`),
    value: count,
    color: getCategoryColor(category),
  }));

  // Prepare data for completion by day bar chart
  const completionData = Object.entries(statistics.tasksByDay).map(([date, count]) => ({
    name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    value: count,
  }));

  // Prepare data for project progress bar chart
  const projectProgressData = projects.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + "..." : project.name,
    value: project.progress,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("statistics.title")}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("statistics.overview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("dashboard.stats.completedTasks")}
                </span>
                <span className="font-medium">{statistics.completedTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("dashboard.stats.inProgress")}
                </span>
                <span className="font-medium">{statistics.inProgressTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("dashboard.stats.activeProjects")}
                </span>
                <span className="font-medium">{statistics.totalProjects}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total Tasks
                </span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Completion Rate
                </span>
                <span className="font-medium">
                  {tasks.length > 0 
                    ? Math.round((statistics.completedTasks / tasks.length) * 100) + "%" 
                    : "0%"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="time">Time Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>{t("statistics.tasksByStatus")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [value, "Tasks"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>{t("statistics.tasksByPriority")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskPriorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskPriorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [value, "Tasks"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>{t("statistics.tasksByCategory")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [value, "Tasks"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("statistics.projectProgress")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectProgressData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [`${value}%`, "Progress"]} />
                    <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="time" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("statistics.taskCompletionRate")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={completionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [value, "Tasks Completed"]} />
                    <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "programming":
      return "var(--primary)";
    case "design":
      return "#FF5722";
    case "audio":
      return "#00BFA5";
    case "marketing":
      return "#FFC107";
    default:
      return "#9E9E9E";
  }
}
