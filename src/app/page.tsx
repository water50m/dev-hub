"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, Trash2, RotateCcw, Save, CheckSquare, 
  Square, Layout, Moon, Zap, TreePine, Crown, 
  Settings, X, Pencil
} from "lucide-react";
import { Project, Task, Theme } from "@/lib/types";

// --- Components (Inline for simplicity, can handle split files) ---

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('electric'); // Default เป็น Electric Pink
  const [isLoading, setIsLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Load Data
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then((data: Project[]) => {
        setProjects(data);
        const defaultProject = data.find(p => p.isDefault && !p.isDeleted);
        if (defaultProject) setCurrentProjectId(defaultProject.id);
        else if (data.length > 0 && !data[0].isDeleted) setCurrentProjectId(data[0].id);
        setIsLoading(false);
      });
    
    // Load Theme from local storage
    const savedTheme = localStorage.getItem('hub-theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save Data
  const saveData = async (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(updatedProjects),
    });
  };

  // Theme Handling
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hub-theme', theme);
  }, [theme]);

  // --- Actions ---
  const createProject = () => {
    const name = prompt("ตั้งชื่อโปรเจกต์ใหม่:");
    if (!name) return;
    
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description: "",
      tasks: [],
      isDefault: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    
    const updated = [...projects, newProject];
    saveData(updated);
    setCurrentProjectId(newProject.id);
  };

  const deleteProject = (id: string, permanent: boolean = false) => {
    let updated;
    if (permanent) {
      if(!confirm("ยืนยันการลบถาวร?")) return;
      updated = projects.filter(p => p.id !== id);
    } else {
      updated = projects.map(p => p.id === id ? { ...p, isDeleted: true } : p);
      if (currentProjectId === id) setCurrentProjectId(null);
    }
    saveData(updated);
  };

  const restoreProject = (id: string) => {
    const updated = projects.map(p => p.id === id ? { ...p, isDeleted: false } : p);
    saveData(updated);
  };

  const setDefaultProject = (id: string) => {
    const updated = projects.map(p => ({
      ...p,
      isDefault: p.id === id
    }));
    saveData(updated);
  };

  // --- Task & Note Logic ---
  const currentProject = projects.find(p => p.id === currentProjectId);

  const updateCurrentProject = (updates: Partial<Project>) => {
    if (!currentProjectId) return;
    const updated = projects.map(p => 
      p.id === currentProjectId ? { ...p, ...updates } : p
    );
    saveData(updated);
  };

  const toggleTask = (taskId: string) => {
    if (!currentProject) return;
    const newTasks = currentProject.tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    updateCurrentProject({ tasks: newTasks });
  };

  const addTask = (text: string) => {
    if (!currentProject || !text.trim()) return;
    const newTask: Task = { id: crypto.randomUUID(), text, isCompleted: false };
    updateCurrentProject({ tasks: [...currentProject.tasks, newTask] });
  };

  const updateTaskText = (taskId: string, newText: string) => {
    if (!currentProject) return;
    const newTasks = currentProject.tasks.map(t => 
      t.id === taskId ? { ...t, text: newText } : t
    );
    updateCurrentProject({ tasks: newTasks });
  };
  
  const deleteTask = (taskId: string) => {
    if (!currentProject) return;
    const newTasks = currentProject.tasks.filter(t => t.id !== taskId);
    updateCurrentProject({ tasks: newTasks });
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading Hub...</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* --- Sidebar --- */}
      <aside className="w-64 flex flex-col border-r p-4 transition-colors" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            DEV HUB
          </h1>
          <p className="text-xs opacity-60 mt-1">Programmer & Maker Space</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold opacity-70">PROJECTS</span>
            <button onClick={createProject} className="p-1 rounded hover:bg-black/10 transition">
              <Plus size={18} />
            </button>
          </div>
          
          {projects.filter(p => !p.isDeleted).map(p => (
            <div 
              key={p.id}
              onClick={() => setCurrentProjectId(p.id)}
              className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-all ${currentProjectId === p.id ? 'font-bold ring-1 ring-inset' : 'opacity-70 hover:opacity-100'}`}
              style={{ 
                backgroundColor: currentProjectId === p.id ? 'var(--bg-primary)' : 'transparent',
                borderColor: 'var(--accent)',
                boxShadow: currentProjectId === p.id ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <div className="flex items-center gap-2 truncate">
                {p.isDefault && <Crown size={12} className="text-yellow-500" />}
                <span className="truncate">{p.name}</span>
              </div>
              <div className="hidden group-hover:flex gap-1">
                 <button 
                  title="Set Default"
                  onClick={(e) => { e.stopPropagation(); setDefaultProject(p.id); }}
                  className="p-1 hover:text-yellow-500"
                >
                  <Crown size={12} />
                </button>
                <button 
                  title="Move to Trash"
                  onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                  className="p-1 hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trash Toggle */}
        <button 
          onClick={() => setShowTrash(!showTrash)}
          className="mt-4 flex items-center gap-2 text-sm opacity-60 hover:opacity-100 py-2"
        >
          <Trash2 size={16} /> 
          ถังขยะ ({projects.filter(p => p.isDeleted).length})
        </button>

        {/* Theme Switcher */}
        <div className="mt-4 pt-4 border-t flex justify-between" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setTheme('cyberpunk')} title="Cyberpunk" className={`p-2 rounded ${theme === 'cyberpunk' ? 'bg-slate-800 text-cyan-400' : ''}`}><Moon size={18} /></button>
          <button onClick={() => setTheme('forest')} title="Deep Forest" className={`p-2 rounded ${theme === 'forest' ? 'bg-green-100 text-green-800' : ''}`}><TreePine size={18} /></button>
          <button onClick={() => setTheme('electric')} title="Electric Pink" className={`p-2 rounded ${theme === 'electric' ? 'bg-pink-100 text-pink-600' : ''}`}><Zap size={18} /></button>
          <button onClick={() => setTheme('midnight')} title="Midnight Purple" className={`p-2 rounded ${theme === 'midnight' ? 'bg-purple-900 text-purple-200' : ''}`}><Settings size={18} /></button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {showTrash ? (
          // Trash View
          <div className="p-8 flex-1 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-red-500">
              <Trash2 /> ถังขยะ (Deleted Projects)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.filter(p => p.isDeleted).map(p => (
                <div key={p.id} className="border p-4 rounded-lg flex flex-col gap-4" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => restoreProject(p.id)} className="flex-1 py-2 px-4 rounded bg-green-500 text-white flex items-center justify-center gap-2 hover:opacity-90">
                      <RotateCcw size={16} /> กู้คืน
                    </button>
                    <button onClick={() => deleteProject(p.id, true)} className="flex-1 py-2 px-4 rounded bg-red-500 text-white flex items-center justify-center gap-2 hover:opacity-90">
                      <X size={16} /> ลบถาวร
                    </button>
                  </div>
                </div>
              ))}
              {projects.filter(p => p.isDeleted).length === 0 && <p className="opacity-50">ถังขยะว่างเปล่า</p>}
            </div>
            <button onClick={() => setShowTrash(false)} className="absolute top-4 right-4 p-2 rounded hover:bg-black/5">
              <X size={24} />
            </button>
          </div>
        ) : currentProject ? (
          // Project View
          <div className="flex-1 flex flex-col md:flex-row h-full">
             {/* Left: Tasks */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--border)' }}>
              <div className="mb-8 group">
                {isEditingTitle ? (
                  /* โหมดแก้ไข: เป็น Input ใหญ่ๆ */
                  <input
                    autoFocus
                    type="text"
                    value={currentProject.name}
                    onChange={(e) => updateCurrentProject({ name: e.target.value })}
                    onBlur={() => setIsEditingTitle(false)} // คลิกที่อื่นเพื่อบันทึก
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingTitle(false); // กด Enter เพื่อบันทึก
                    }}
                    className="text-4xl font-bold bg-transparent border-b-2 focus:outline-none w-full pb-2 mb-2"
                    style={{ 
                      color: 'var(--accent)', 
                      borderColor: 'var(--accent)' 
                    }}
                  />
                ) : (
                  /* โหมดแสดงผลปกติ: กดที่ชื่อ หรือ ไอคอนดินสอ เพื่อแก้ไข */
                  <h2 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-4xl font-bold mb-2 cursor-pointer flex items-center gap-3 select-none" 
                    style={{ color: 'var(--accent)' }}
                    title="คลิกเพื่อแก้ไขชื่อ"
                  >
                    {currentProject.name}
                    {/* ไอคอนดินสอ จะโผล่มาเมื่อเอาเมาส์ชี้ (Hover) */}
                    <Pencil 
                      size={28} 
                      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" 
                      style={{ color: 'var(--text-secondary)' }}
                    />
                  </h2>
                )}

                <div className="flex items-center gap-2 text-sm opacity-60">
                    <span>Tasks: {currentProject.tasks.filter(t => t.isCompleted).length}/{currentProject.tasks.length}</span>
                    {currentProject.isDefault && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">DEFAULT</span>}
                </div>
              </div>

              <div className="space-y-3">
                {currentProject.tasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 group">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={`mt-1 transition-colors ${task.isCompleted ? 'text-green-500' : 'opacity-40 hover:opacity-100'}`}
                    >
                      {task.isCompleted ? <CheckSquare size={22} /> : <Square size={22} />}
                    </button>
                    
                    {/* Inline Edit Input */}
                    <input 
                      type="text" 
                      value={task.text}
                      onChange={(e) => updateTaskText(task.id, e.target.value)}
                      className={`w-full bg-transparent border-none focus:ring-0 p-0 text-lg transition-all
                        /* 1. ลบ class 'line-through' ออกไปเลยครับ เราไม่ใช้แล้ว */
                        ${task.isCompleted ? 'opacity-100 font-semibold' : ''} 
                      `}
                      style={{ 
                        color: task.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                        
                        // --- 2. เพิ่มชุดคำสั่งสร้างเส้นขีดฆ่าแบบกำหนดเอง ---
                        backgroundImage: task.isCompleted ? 'linear-gradient(currentColor, currentColor)' : 'none',
                        backgroundSize: '100% 2px',      // ความหนาของเส้น (แก้เป็น 1.5px หรือ 3px ได้ตามชอบ)
                        backgroundRepeat: 'no-repeat',
                        
                        // *** 3. ปรับความสูงเส้นตรงนี้ครับ ***
                        // 0% = บนสุด, 50% = ตรงกลางเป๊ะ, 100% = ล่างสุด
                        // สำหรับฟอนต์ Kanit/ภาษาไทย แนะนำช่วง 45% - 48% จะดูเข้า "เอว" ตัวหนังสือพอดีครับ
                        backgroundPosition: '0 55%' 
                      }}
                    />

                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 p-1 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                {/* New Task Input */}
                <div className="flex items-center gap-3 mt-6 opacity-60 hover:opacity-100 transition-opacity">
                  <Plus size={22} />
                  <input 
                    type="text" 
                    placeholder="เพิ่มรายการใหม่..." 
                    className="bg-transparent border-none focus:ring-0 p-0 text-lg w-full placeholder:text-current opacity-70"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addTask(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Documentation */}
            <div className="w-full md:w-1/3 p-6 md:p-10 flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <h3 className="text-xl font-bold mb-4 opacity-80 flex items-center gap-2">
                 Documentation / Notes
              </h3>
              <textarea 
                className="flex-1 w-full bg-transparent resize-none focus:outline-none leading-relaxed p-4 rounded border border-transparent focus:border-opacity-50 transition-all"
                style={{ borderColor: 'var(--accent)' }}
                placeholder="บันทึกรายละเอียด, ไอเดีย, หรือสิ่งที่ต้องจำ..."
                value={currentProject.description}
                onChange={(e) => updateCurrentProject({ description: e.target.value })}
              />
              <div className="mt-2 text-xs opacity-40 text-right">
                Auto-saved to local JSON
              </div>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center opacity-40">
            <Layout size={64} strokeWidth={1} />
            <p className="mt-4 text-xl">เลือกโปรเจกต์ หรือ สร้างใหม่</p>
          </div>
        )}
      </main>
    </div>
  );
}