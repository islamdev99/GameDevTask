import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import ProjectCard from "@/components/dashboard/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProjectForm from "@/components/projects/project-form";
import { Plus, Search } from "lucide-react";

export default function Projects() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(search.toLowerCase()));
    const matchesPhase = phaseFilter === "all" || project.phase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t("projects.title")}</h2>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t("actions.newProject")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{t("projects.newProject")}</DialogTitle>
            <ProjectForm onSuccess={() => setOpenDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
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
          value={phaseFilter}
          onValueChange={setPhaseFilter}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t("projects.phase")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="pre-production">
              {t("projects.phases.preProduction")}
            </SelectItem>
            <SelectItem value="production">
              {t("projects.phases.production")}
            </SelectItem>
            <SelectItem value="post-production">
              {t("projects.phases.postProduction")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-10">{t("app.loading")}</div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-6xl mb-2">🎮</div>
          <h3 className="text-xl font-medium mb-2">No projects found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {search || phaseFilter !== "all"
              ? "Try changing your search or filter"
              : "Start by creating your first game project"}
          </p>
          <Button
            className="bg-primary text-white"
            onClick={() => setOpenDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("actions.newProject")}
          </Button>
        </div>
      )}
    </div>
  );
}
