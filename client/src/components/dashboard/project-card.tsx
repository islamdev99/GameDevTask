import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import { Project } from "@shared/schema";
import { Link } from "wouter";
import { CalendarIcon } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export function getPhaseLabel(phase: string, t: (key: string) => string) {
  switch (phase) {
    case "pre-production":
      return t("projects.phases.preProduction");
    case "production":
      return t("projects.phases.production");
    case "post-production":
      return t("projects.phases.postProduction");
    default:
      return phase;
  }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useLanguage();

  const gradientColors = {
    "pre-production": "from-pink-500 to-red-500",
    "production": "from-purple-500 to-indigo-600",
    "post-production": "from-green-500 to-teal-500",
  };

  const gradient = gradientColors[project.phase as keyof typeof gradientColors] || "from-blue-500 to-cyan-500";

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
        <div 
          className={`h-32 bg-gradient-to-r ${gradient} relative`}
          style={{ backgroundColor: project.color }}
        >
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg px-3 py-1 text-xs font-medium text-gray-800 dark:text-gray-200">
            {getPhaseLabel(project.phase, t)}
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-bold text-lg mb-2">{project.name}</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{project.description}</p>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>{t("projects.progress")}</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
          {project.deadline && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>
                {t("projects.dueIn")} {formatDistanceToNow(new Date(project.deadline))}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
