import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { getPhaseLabel } from "@/components/dashboard/project-card";
import { Task } from "@shared/schema";
import TaskItem from "@/components/dashboard/task-item";
import TaskForm from "@/components/tasks/task-form";
import ProjectForm from "@/components/projects/project-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Edit, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projectId = parseInt(id);
  const { t } = useLanguage();
  const { toast } = useToast();
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { projectId }],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => {
      return apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: t("projects.title"),
        description: "Project deleted successfully",
      });
      navigate("/projects");
    },
  });

  if (projectLoading) {
    return <div className="flex justify-center items-center h-64">{t("app.loading")}</div>;
  }

  if (!project) {
    return (
      <div className="text-center py-10">
        <h3 className="text-2xl font-bold mb-2">Project not found</h3>
        <p className="mb-4">The project you're looking for doesn't exist or has been deleted.</p>
        <Link href="/projects">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  const getFilteredTasks = (status?: string) => {
    if (!tasks) return [];
    if (!status || status === "all") return tasks;
    return tasks.filter(task => task.status === status);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">{project.name}</h2>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={openTaskDialog} onOpenChange={setOpenTaskDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("tasks.addTask")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <TaskForm 
                projectId={projectId} 
                onSuccess={() => setOpenTaskDialog(false)} 
              />
            </DialogContent>
          </Dialog>

          <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                {t("actions.edit")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ProjectForm 
                projectId={projectId} 
                initialData={project}
                onSuccess={() => setOpenEditDialog(false)} 
              />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {t("actions.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this project? This action cannot be undone
                  and will also delete all tasks associated with this project.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground"
                  onClick={() => deleteProjectMutation.mutate()}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("projects.details")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("projects.description")}
                </h4>
                <p>{project.description || "No description provided"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("projects.phase")}
                </h4>
                <div 
                  className="inline-block px-3 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: `${project.color}20`, 
                    color: project.color
                  }}
                >
                  {getPhaseLabel(project.phase, t)}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("projects.deadline")}
                </h4>
                {project.deadline ? (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(project.deadline), "PPP")}
                  </div>
                ) : (
                  <p>No deadline set</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("projects.progress")}
                </h4>
                <div className="flex items-center">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-3">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right">{project.progress}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("statistics.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="p-8 text-center">{t("app.loading")}</div>
            ) : tasks ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Tasks Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("tasks.statuses.notStarted")}</span>
                      <span>{tasks.filter(t => t.status === "not-started").length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("tasks.statuses.inProgress")}</span>
                      <span>{tasks.filter(t => t.status === "in-progress").length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("tasks.statuses.completed")}</span>
                      <span>{tasks.filter(t => t.status === "completed").length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Tasks by Priority
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("tasks.priorities.high")}</span>
                      <span>{tasks.filter(t => t.priority === "high").length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("tasks.priorities.medium")}</span>
                      <span>{tasks.filter(t => t.priority === "medium").length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("tasks.priorities.low")}</span>
                      <span>{tasks.filter(t => t.priority === "low").length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Total Tasks
                  </h4>
                  <div className="text-3xl font-bold">{tasks.length}</div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">No statistics available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center p-4">
          <CardTitle className="text-lg font-semibold">{t("projects.tasks")}</CardTitle>
          
          <Button
            onClick={() => setOpenTaskDialog(true)}
            className="bg-primary px-3 py-1 rounded text-white flex items-center text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>{t("tasks.addTask")}</span>
          </Button>
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
              {tasksLoading ? (
                <div className="p-8 text-center">{t("app.loading")}</div>
              ) : getFilteredTasks().length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-3">📋</div>
                  <p>{t("tasks.noTasks")}</p>
                </div>
              ) : (
                getFilteredTasks().map(task => (
                  <TaskItem key={task.id} task={task} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="not-started" className="mt-0">
              {tasksLoading ? (
                <div className="p-8 text-center">{t("app.loading")}</div>
              ) : getFilteredTasks("not-started").length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-3">🗓️</div>
                  <p>{t("tasks.noTasks")}</p>
                </div>
              ) : (
                getFilteredTasks("not-started").map(task => (
                  <TaskItem key={task.id} task={task} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="in-progress" className="mt-0">
              {tasksLoading ? (
                <div className="p-8 text-center">{t("app.loading")}</div>
              ) : getFilteredTasks("in-progress").length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-3">⏳</div>
                  <p>{t("tasks.noTasks")}</p>
                </div>
              ) : (
                getFilteredTasks("in-progress").map(task => (
                  <TaskItem key={task.id} task={task} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              {tasksLoading ? (
                <div className="p-8 text-center">{t("app.loading")}</div>
              ) : getFilteredTasks("completed").length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-6xl mb-3">✅</div>
                  <p>{t("tasks.noTasks")}</p>
                </div>
              ) : (
                getFilteredTasks("completed").map(task => (
                  <TaskItem key={task.id} task={task} />
                ))
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
