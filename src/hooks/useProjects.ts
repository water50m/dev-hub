// hooks/useProjects.ts
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Project, Task } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Recursive Helpers (เหมือนเดิม) ---
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

const addSiblingInTree = (tasks: Task[], refId: string, newTask: Task): Task[] => {
  // 1. หาในระดับปัจจุบันก่อน
  const index = tasks.findIndex(t => t.id === refId);
  if (index !== -1) {
    // เจอแล้ว! แทรกตัวใหม่ต่อท้าย
    const newTasks = [...tasks];
    newTasks.splice(index + 1, 0, newTask);
    return newTasks;
  }
  
  // 2. ถ้าไม่เจอ ให้วนหาในลูกๆ (Recursive)
  return tasks.map(t => {
    if (t.subtasks && t.subtasks.length > 0) {
      return { ...t, subtasks: addSiblingInTree(t.subtasks, refId, newTask) };
    }
    return t;
  });
};

// Helper 1: กระจายสถานะลงลูกหลาน (แม่ -> ลูก)
const setStatusDownstream = (task: Task, status: boolean): Task => {
  return {
    ...task,
    isCompleted: status,
    subtasks: task.subtasks?.map(s => setStatusDownstream(s, status)) || []
  };
};

// Helper 2: ตรวจสอบสถานะย้อนขึ้นบน (ลูก -> แม่)
// ฟังก์ชันนี้จะ "จัดระเบียบ" (Normalize) ทั้ง Tree ให้สถานะแม่ตรงกับลูกเสมอ
const normalizeStatusUpstream = (tasks: Task[]): Task[] => {
  return tasks.map(task => {
    // 1. Recurse ลงไปจัดการลูกๆ ก่อน (Depth-First)
    const updatedSubtasks = task.subtasks ? normalizeStatusUpstream(task.subtasks) : [];

    // 2. คำนวณสถานะตัวเองจากลูกๆ
    let newIsCompleted = task.isCompleted;

    if (updatedSubtasks.length > 0) {
      // กฎ: แม่จะเสร็จ ก็ต่อเมื่อ "ลูกทุกคนเสร็จ"
      const allChildrenDone = updatedSubtasks.every(t => t.isCompleted);
      newIsCompleted = allChildrenDone;
    }

    return {
      ...task,
      subtasks: updatedSubtasks,
      isCompleted: newIsCompleted
    };
  });
};

// Helper 3: ค้นหาและ Toggle เป้าหมาย (ก่อนจะส่งไป Normalize)
const toggleTargetAndDescendants = (tasks: Task[], targetId: string): Task[] => {
  return tasks.map(t => {
    if (t.id === targetId) {
      // เจอตัวที่กดแล้ว! สลับสถานะตัวเอง และบังคับลูกน้องเปลี่ยนตาม
      const newStatus = !t.isCompleted;
      return setStatusDownstream(t, newStatus);
    }
    // ถ้ายังไม่เจอ ให้หาในลูกต่อ
    if (t.subtasks?.length) {
      return { ...t, subtasks: toggleTargetAndDescendants(t.subtasks, targetId) };
    }
    return t;
  });
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch: ใช้การ Alias ชื่อ Column (is_default -> isDefault) ตรงๆ ในคำสั่ง SQL เลย
  const fetchProjects = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*, isDefault:is_default, isDeleted:is_deleted') // <--- แก้ตรงนี้ครับ
      .order('created_at', { ascending: true });

    if (!error && data) {
      setProjects(data as any); // cast any เพื่อข้าม Type check ชั่วคราว (แต่ข้อมูลถูกต้องแน่นอน)
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 2. Update: แปลงค่ากลับเป็น snake_case ก่อนส่งเข้า DB
  const updateProject = async (id: string, updates: Partial<Project>) => {
    // Optimistic Update (แก้หน้าจอทันที)
    const updatedProjects = projects.map(p => p.id === id ? { ...p, ...updates } : p);
    setProjects(updatedProjects);

    // แปลงข้อมูลสำหรับส่งเข้า DB (Mapping)
    const dbPayload: any = { ...updates };
    if ('isDefault' in updates) {
        dbPayload.is_default = updates.isDefault;
        delete dbPayload.isDefault;
    }
    if ('isDeleted' in updates) {
        dbPayload.is_deleted = updates.isDeleted;
        delete dbPayload.isDeleted;
    }

    // ส่งเข้า Supabase
    const { error } = await supabase
      .from('projects')
      .update(dbPayload)
      .eq('id', id);

    if (error) {
      console.error("Update failed:", error);
      fetchProjects(); 
    }
  };

  const addProject = async (name: string) => {
    const newProject = {
      name,
      description: "",
      tasks: [],
      is_default: false, // ส่งเป็น snake_case
      is_deleted: false,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select('*, isDefault:is_default, isDeleted:is_deleted') // Alias ขากลับด้วย
      .single();

    if (!error && data) {
      setProjects([...projects, data]);
      return data.id;
    }
  };

  const deleteProject = async (id: string, permanent = false) => {
    if (permanent) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (!error) setProjects(projects.filter(p => p.id !== id));
    } else {
      updateProject(id, { isDeleted: true }); // ใช้ isDeleted (camelCase) ได้เลย เดี๋ยวฟังก์ชัน updateProject แปลงให้
    }
  };

  const setDefault = async (id: string) => {
    // 1. อัปเดต State หน้าเว็บก่อนเลยเพื่อความลื่นไหล
    const updatedProjects = projects.map(p => ({
        ...p,
        isDefault: p.id === id // ตัวที่เลือกเป็น true, ที่เหลือเป็น false
    }));
    setProjects(updatedProjects);

    // 2. สั่ง DB เคลียร์ค่าเดิมทั้งหมดก่อน
    await supabase.from('projects').update({ is_default: false }).neq('id', id);
    
    // 3. สั่ง DB ตั้งค่าใหม่
    await supabase.from('projects').update({ is_default: true }).eq('id', id);
  };

const projectTaskAction = (projectId: string, actionType: string, payload: any) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Deep Copy เพื่อความชัวร์
    let newTasks = JSON.parse(JSON.stringify(project.tasks));

    switch (actionType) {
      case 'toggle':
        // 1. เปลี่ยนสถานะตัวที่กด (และลูกน้อง)
        newTasks = toggleTargetAndDescendants(newTasks, payload.id);
        
        // 2. คำนวณสถานะแม่ๆ ใหม่ทั้งระบบ (Auto-Check Logic)
        newTasks = normalizeStatusUpstream(newTasks);
        break;
      case 'text':
        newTasks = updateTaskInTree(newTasks, payload.id, t => ({ ...t, text: payload.text }));
        break;
      case 'delete':
        newTasks = deleteTaskInTree(newTasks, payload.id);
        // ลบเสร็จ ต้อง Normalize ด้วย (เผื่อลบลูกที่ยังไม่เสร็จออกจนหมด แม่ต้องเสร็จตาม)
        newTasks = normalizeStatusUpstream(newTasks); 
        break;
      case 'addSub':
        // เพิ่มลูก (Subtask)
        const newSub = { id: crypto.randomUUID(), text: "", isCompleted: false, subtasks: [], isExpanded: true };
        newTasks = addSubtaskInTree(newTasks, payload.id, newSub);
        break;
      case 'expand':
        newTasks = updateTaskInTree(newTasks, payload.id, t => ({ ...t, isExpanded: !t.isExpanded }));
        break;
      
      case 'addSibling':
        const sibling = { id: crypto.randomUUID(), text: "", isCompleted: false, subtasks: [], isExpanded: true };
        newTasks = addSiblingInTree(newTasks, payload.refId, sibling);
        // เพิ่มพี่น้อง ไม่กระทบแม่ (เพราะอยู่ระดับเดียวกัน) แต่ Normalize กันเหนียวได้
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
    restoreProject: (id: string) => updateProject(id, { isDeleted: false }),
    setDefault,
    projectTaskAction
  };
}