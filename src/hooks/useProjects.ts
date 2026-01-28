// hooks/useProjects.ts
import { useState, useEffect } from 'react';
import { Project, Task } from '@/lib/types';

// --- Recursive Helpers (ย้ายมาจาก page.tsx) ---
// คุณสามารถย้าย helpers พวกนี้ไปไว้ใน lib/utils.ts ได้ถ้าต้องการให้ hook สะอาดขึ้น
const updateTaskInTree = (tasks: Task[], targetId: string, updateFn: (t: Task) => Task): Task[] => {
  return tasks.map(t => {
    if (t.id === targetId) return updateFn(t);
    if (t.subtasks?.length) return { ...t, subtasks: updateTaskInTree(t.subtasks, targetId, updateFn) };
    return t;
  });
};

const deleteTaskInTree = (tasks: Task[], targetId: string): Task[] => {
    const filtered = tasks.filter(t => t.id !== targetId);
    return filtered.map(t => ({
      ...t,
      subtasks: t.subtasks ? deleteTaskInTree(t.subtasks, targetId) : []
    }));
};

const addSubtaskInTree = (tasks: Task[], parentId: string, newSubtask: Task): Task[] => {
    return tasks.map(t => {
      if (t.id === parentId) {
        return { ...t, subtasks: [...(t.subtasks || []), newSubtask], isExpanded: true };
      }
      if (t.subtasks?.length) return { ...t, subtasks: addSubtaskInTree(t.subtasks, parentId, newSubtask) };
      return t;
    });
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Data
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setIsLoading(false);
      });
  }, []);

  // Save Helper
  const save = async (newProjects: Project[]) => {
    setProjects(newProjects);
    await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(newProjects),
    });
  };

  // --- Actions ---
  const addProject = (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description: "",
      tasks: [],
      isDefault: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    save([...projects, newProject]);
    return newProject.id; // Return ID to switch to it
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    save(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string, permanent = false) => {
    if (permanent) {
      save(projects.filter(p => p.id !== id));
    } else {
      save(projects.map(p => p.id === id ? { ...p, isDeleted: true } : p));
    }
  };

  const restoreProject = (id: string) => {
    save(projects.map(p => p.id === id ? { ...p, isDeleted: false } : p));
  };

  const setDefault = (id: string) => {
    save(projects.map(p => ({ ...p, isDefault: p.id === id })));
  };

  // --- Task Actions Wrapper ---
  // รวม logic update tree ไว้ที่นี่ หน้าบ้านจะได้เรียกใช้แค่ function เดียว
  const projectTaskAction = (projectId: string, actionType: 'toggle' | 'text' | 'delete' | 'addSub' | 'expand' | 'add', payload: any) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    let newTasks = [...project.tasks];

    switch (actionType) {
        case 'toggle':
            newTasks = updateTaskInTree(newTasks, payload.id, t => ({ ...t, isCompleted: !t.isCompleted }));
            break;
        case 'text':
            newTasks = updateTaskInTree(newTasks, payload.id, t => ({ ...t, text: payload.text }));
            break;
        case 'delete':
            newTasks = deleteTaskInTree(newTasks, payload.id);
            break;
        case 'addSub':
             const newSub: Task = { id: crypto.randomUUID(), text: "New Subtask", isCompleted: false, subtasks: [], isExpanded: true };
             newTasks = addSubtaskInTree(newTasks, payload.id, newSub);
             break;
        case 'expand':
            newTasks = updateTaskInTree(newTasks, payload.id, t => ({ ...t, isExpanded: !t.isExpanded }));
            break;
        case 'add':
             newTasks.push({ id: crypto.randomUUID(), text: payload.text, isCompleted: false, subtasks: [], isExpanded: true });
             break;
    }
    updateProject(projectId, { tasks: newTasks });
  };

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    restoreProject,
    setDefault,
    projectTaskAction // Expose ตัวเดียวจบ
  };
}