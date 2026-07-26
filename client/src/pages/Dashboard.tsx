import { useEffect, useMemo, useState } from "react";
import { ProjectSidebar, TaskPanel } from "@components/index";
import { getProjects } from "@api/projects";
import { SmartView } from "@/api/tasks";
import { Project } from "@/types";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<number | SmartView>("today");

  // ✅ useMemo — not recalculated on every render
  const inboxProject = useMemo(
    () => projects.find((p) => p.is_default),
    [projects],
  );

  useEffect(() => {
    getProjects().then((p) => setProjects(p));
  }, []);

  const handleUpdate = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProject = (id: number) => {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (active === id) setActive("today");
      return remaining;
    });
  };

  return (
    <div className="flex md:flex-row flex-col md:gap-6 gap-2 min-h-screen md:p-6 p-2">
      <ProjectSidebar
        active={active}
        projects={projects}
        onSelect={setActive}
        onCreate={(p: Project) => {
          setProjects((prev) => [...prev, p]);
          setActive(p.id);
        }}
        onDelete={handleDeleteProject}
        onUpdate={handleUpdate}
      />

      {typeof active === "string" ? (
        <TaskPanel
          projects={projects}
          view={active as SmartView}
          inboxProjectId={inboxProject?.id}
        />
      ) : (
        <TaskPanel projects={projects} projectId={active} />
      )}
    </div>
  );
}
