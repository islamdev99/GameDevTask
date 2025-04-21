import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, Task } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { format, addDays, isBefore, startOfToday, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getAllProjects, getAllTasks } from "@/lib/indexedDb";
import { cn } from "@/lib/utils";

export default function Timeline() {
  const { t } = useLanguage();
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [tasksData, setTasksData] = useState<Task[]>([]);
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [daysToDisplay, setDaysToDisplay] = useState<Date[]>([]);
  
  // Get all data from IndexedDB
  useEffect(() => {
    async function fetchData() {
      try {
        const projects = await getAllProjects();
        const tasks = await getAllTasks();
        setProjectsData(projects);
        setTasksData(tasks);
        
        // By default, select all projects
        if (selectedProjects.length === 0 && projects.length > 0) {
          setSelectedProjects(projects.map(p => p.id));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
    
    fetchData();
  }, []);
  
  // Set days to display based on current view and date
  useEffect(() => {
    if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      setDaysToDisplay(eachDayOfInterval({ start: monthStart, end: monthEnd }));
    } else {
      // Week view - 7 days from current date
      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(addDays(currentDate, i));
      }
      setDaysToDisplay(days);
    }
  }, [view, currentDate]);
  
  // Handle project selection
  const handleProjectSelection = (projectId: string) => {
    const id = parseInt(projectId);
    if (selectedProjects.includes(id)) {
      setSelectedProjects(selectedProjects.filter(p => p !== id));
    } else {
      setSelectedProjects([...selectedProjects, id]);
    }
  };
  
  // Handle date navigation
  const navigatePrevious = () => {
    if (view === "month") {
      setCurrentDate(prevDate => addMonths(prevDate, -1));
    } else {
      setCurrentDate(prevDate => addDays(prevDate, -7));
    }
  };
  
  const navigateNext = () => {
    if (view === "month") {
      setCurrentDate(prevDate => addMonths(prevDate, 1));
    } else {
      setCurrentDate(prevDate => addDays(prevDate, 7));
    }
  };
  
  // Get filtered tasks based on selected projects and dates
  const getFilteredTasks = () => {
    return tasksData.filter(task => 
      task.deadline && 
      selectedProjects.includes(task.projectId || 0) &&
      daysToDisplay.some(day => 
        format(new Date(task.deadline as Date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      )
    );
  };
  
  // Get task color based on status
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };
  
  // Get project name by ID
  const getProjectName = (projectId: number | null) => {
    if (!projectId) return t("tasks.noProject");
    const project = projectsData.find(p => p.id === projectId);
    return project ? project.name : t("tasks.noProject");
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t("navigation.timeline")}</h1>
          
          <div className="flex items-center space-x-2">
            <Select 
              value={view} 
              onValueChange={(val) => setView(val as "month" | "week")}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{t("timeline.monthView")}</SelectItem>
                <SelectItem value="week">{t("timeline.weekView")}</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-medium min-w-[150px] text-center">
                {format(currentDate, view === "month" ? 'MMMM yyyy' : 'MMM d')} - 
                {view === "week" && format(addDays(currentDate, 6), ' MMM d, yyyy')}
                {view === "month" && format(currentDate, ', yyyy')}
              </div>
              <Button variant="outline" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{t("projects.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {projectsData.map(project => (
                    <div 
                      key={project.id}
                      className={cn(
                        "p-2 rounded cursor-pointer flex items-center",
                        selectedProjects.includes(project.id) 
                          ? "bg-primary bg-opacity-10" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                      onClick={() => handleProjectSelection(project.id.toString())}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="truncate">{project.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{t("tasks.timeline")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {daysToDisplay.map((day, index) => (
                        <div key={index} className="text-center text-sm font-medium p-1">
                          <div className="mb-1">{format(day, 'E')}</div>
                          <div 
                            className={cn(
                              "rounded-full w-8 h-8 mx-auto flex items-center justify-center",
                              format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                ? "bg-primary text-primary-foreground"
                                : ""
                            )}
                          >
                            {format(day, 'd')}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {getFilteredTasks().map(task => {
                        const deadline = new Date(task.deadline as Date);
                        const dayIndex = daysToDisplay.findIndex(day => 
                          format(day, 'yyyy-MM-dd') === format(deadline, 'yyyy-MM-dd')
                        );
                        
                        if (dayIndex === -1) return null;
                        
                        return (
                          <div 
                            key={task.id}
                            className="grid grid-cols-7 gap-1"
                          >
                            {Array.from({ length: dayIndex }).map((_, i) => (
                              <div key={i} className="p-1"></div>
                            ))}
                            <div 
                              className={cn(
                                "p-2 rounded border shadow-sm",
                                getTaskStatusColor(task.status)
                              )}
                              style={{
                                gridColumn: `span 1 / span 1`,
                              }}
                            >
                              <div className="text-sm font-medium truncate">
                                {task.title}
                              </div>
                              <div className="text-xs opacity-80 truncate">
                                {getProjectName(task.projectId)}
                              </div>
                              {task.assignedTo && (
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {task.assignedTo}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {getFilteredTasks().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>{t("timeline.noTasks")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}