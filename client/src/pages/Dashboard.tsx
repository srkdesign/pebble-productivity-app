import { useEffect, useState } from "react";

import ProjectSidebar from "../components/ProjectSidebar";
import TaskPanel from "../components/TaskPanel";
import { getProjects } from "../api/projects";
import { getTasks } from "../api/tasks";

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<number>(1);

  useEffect(() => {
    getProjects().then((p) => {
      setProjects(p);
      if (p.length) setActiveProject(p[0].id);
    });

    getTasks().then(setTasks);
  }, []);

  const handleUpdate = (updated: any) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div className="md:flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <ProjectSidebar
        active={activeProject}
        projects={projects}
        onCreate={(p: any) => {
          setProjects((prev) => [...prev, p]);
          setActiveProject(p.id);
        }}
        onSelect={setActiveProject}
        onUpdate={handleUpdate}
      />

      <TaskPanel
        tasks={tasks}
        setTasks={setTasks}
        projects={projects}
        projectId={activeProject}
      />
    </div>
  );
}
