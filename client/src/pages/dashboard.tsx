import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import StatCard from "@/components/dashboard/stat-card";
import ProjectCard from "@/components/dashboard/project-card";
import TaskList from "@/components/dashboard/task-list";
import Charts from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { Project } from "@shared/schema";
import { CheckCircle, Clock, Folder, ChevronRight } from "lucide-react";

export default function Dashboard() {
  const { t } = useLanguage();
  
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/statistics"],
  });

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">{t("dashboard.overview")}</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-primary" />}
          iconBgColor="bg-primary bg-opacity-10"
          title={t("dashboard.stats.completedTasks")}
          value={statsLoading ? "..." : statistics?.completedTasks || 0}
        />
        
        <StatCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          iconBgColor="bg-amber-500 bg-opacity-10"
          title={t("dashboard.stats.inProgress")}
          value={statsLoading ? "..." : statistics?.inProgressTasks || 0}
        />
        
        <StatCard
          icon={<Folder className="h-5 w-5 text-teal-500" />}
          iconBgColor="bg-teal-500 bg-opacity-10"
          title={t("dashboard.stats.activeProjects")}
          value={projectsLoading ? "..." : projects?.length || 0}
        />
      </div>
      
      {/* Projects Overview */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{t("dashboard.yourProjects")}</h3>
          <Link href="/projects">
            <Button variant="link" className="text-primary flex items-center p-0">
              <span>{t("actions.viewAll")}</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsLoading ? (
            <p>{t("app.loading")}</p>
          ) : projects && projects.length > 0 ? (
            projects.slice(0, 3).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <p>No projects found</p>
          )}
        </div>
      </div>
      
      {/* Tasks Section */}
      <TaskList />
      
      {/* Statistics Section */}
      <Charts />
    </div>
  );
}
