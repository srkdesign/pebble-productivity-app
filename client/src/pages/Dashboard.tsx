import { useEffect, useState } from "react";

import ProjectSidebar from "../components/ProjectSidebar";
import TaskPanel from "../components/TaskPanel";
import { getProjects } from "../api/projects";

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
    <div className="flex md:flex-row flex-col gap-10 min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <ProjectSidebar
        active={activeProject}
        projects={projects}
        onCreate={(p: any) => {
          setProjects((prev) => [...prev, p]);
          setActiveProject(p.id);
        }}
        onSelect={setActiveProject}
        onUpdate={handleUpdate}
        onDelete={handleDeleteProject}
      />

      <TaskPanel projects={projects} projectId={activeProject} />
    </div>
  );
}
