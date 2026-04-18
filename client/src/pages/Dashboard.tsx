import { useEffect, useState } from "react";
import { ProjectSidebar, TaskPanel } from "@components/index";
import { getProjects } from "@api/projects";

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<number>(1);

  useEffect(() => {
    getProjects().then((p) => {
      setProjects(p);
      if (p.length) setActiveProject(p[0].id);
    });
  }, []);

  const handleUpdate = (updated: any) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProject = (id: number) => {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== id);

      if (activeProject === id) {
        setActiveProject(remaining[0]?.id ?? null);
      }

      return remaining;
    });
  };

  return (
    <div className="flex md:flex-row flex-col md:gap-6 gap-2 min-h-screen  md:p-6 p-2">
      <ProjectSidebar
        active={activeProject}
        projects={projects}
        onCreate={(p: any) => {
          setProjects((prev) => [...prev, p]);
          setActiveProject(p.id);
        }}
        onDelete={handleDeleteProject}
        onSelect={setActiveProject}
        onUpdate={handleUpdate}
      />

      <TaskPanel projectId={activeProject} projects={projects} />
    </div>
  );
}
