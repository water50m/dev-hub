"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, RotateCcw, Layout, Moon, Zap, Ghost,
  TreePine, Crown, Settings, X, Pencil, Eye, EyeOff
} from "lucide-react";
import { Theme } from "@/lib/types";
import { useProjects } from "@/hooks/useProjects"; // เรียกใช้ Hook ที่เราทำไว้
import TaskItem from "@/components/TaskItem";      // เรียกใช้ Component ที่เราแยกไว้

export default function Home() {
  // 1. เรียกใช้ Logic ทั้งหมดจาก Hook (บรรทัดเดียวจบ)
  const {
    projects, isLoading, addProject, updateProject,
    deleteProject, restoreProject, setDefault, projectTaskAction
  } = useProjects();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('electric');
  const [showTrash, setShowTrash] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isBlindEnabled, setIsBlindEnabled] = useState(true); // Default เป็น true (Blind)

  // Auto-select Project เมื่อโหลดเสร็จ
  useEffect(() => {
    if (!isLoading && !currentProjectId) {
      const def = projects.find(p => p.isDefault && !p.isDeleted);
      if (def) setCurrentProjectId(def.id);
      else if (projects.length > 0 && !projects[0].isDeleted) setCurrentProjectId(projects[0].id);
    }
  }, [isLoading, projects, currentProjectId]);

  // Load & Save Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('hub-theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hub-theme', theme);
  }, [theme]);

  // Handle Actions
  const handleCreateProject = async () => {
    const name = prompt("ตั้งชื่อโปรเจกต์ใหม่:");
    if (name) {
      const newId = await addProject(name);
      setCurrentProjectId(newId);
    }
  };

  const currentProject = projects.find(p => p.id === currentProjectId);

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading Hub...</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ---------------- Sidebar (เมนูซ้าย) กลับมาแล้วครับ ---------------- */}
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
            <button onClick={handleCreateProject} className="p-1 rounded hover:bg-black/10 transition">
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
              }}
            >
              <div className="flex items-center gap-2 truncate">
                {p.isDefault && <Crown size={12} className="text-yellow-500" />}
                <span className="truncate">{p.name}</span>
              </div>
              <div className="hidden group-hover:flex gap-1">
                <button
                  title="Set Default"
                  onClick={(e) => { e.stopPropagation(); setDefault(p.id); }}
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

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {showTrash ? (
          // Trash View
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-red-500"><Trash2 /> ถังขยะ (Deleted Projects)</h2>
              <button onClick={() => setShowTrash(false)} className="p-2 hover:bg-black/5 rounded"><X size={24} /></button>
            </div>
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
          </div>
        ) : currentProject ? (
          // Project View
          <div className="flex-1 flex flex-col md:flex-row h-full">
            {/* Left: Tasks */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--border)' }}>

              {/* Header (Click to Edit) */}
              <div className="mb-8 group">
                {isEditingTitle ? (
                  <input
                    autoFocus
                    type="text"
                    value={currentProject.name}
                    onChange={(e) => updateProject(currentProject.id, { name: e.target.value })}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingTitle(false);
                    }}
                    className="text-4xl font-bold bg-transparent border-b-2 focus:outline-none w-full pb-2 mb-2"
                    style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
                  />
                ) : (
                  <h2
                    onClick={() => setIsEditingTitle(true)}
                    className="text-4xl font-bold mb-2 cursor-pointer flex items-center gap-3 select-none"
                    style={{ color: 'var(--accent)' }}
                    title="คลิกเพื่อแก้ไขชื่อ"
                  >
                    {currentProject.name}
                    <Pencil
                      size={28}
                      className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                  </h2>
                )}
                <div className="flex items-center gap-2 text-sm opacity-60">
                  {currentProject.isDefault && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold">DEFAULT</span>}
                </div>
              </div>

              <div className="flex justify-end mb-2 gap-2">
                {/* --- 1. นี่คือจุดที่ใช้ setIsBlindEnabled ครับ --- */}
                <button 
                  onClick={() => setIsBlindEnabled(!isBlindEnabled)} // <--- สลับค่า True/False ตรงนี้
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors 
                    ${!isBlindEnabled ? 'bg-green-100 text-green-700 font-bold' : 'opacity-50 hover:opacity-100 hover:bg-black/5'}`}
                  title={isBlindEnabled ? "Switch to Clear View" : "Switch to Blind Mode"}
                >
                  <Ghost size={14} />
                  {!isBlindEnabled ? "Clear View" : "Blind Mode"}
                </button>
                {/* ------------------------------------------- */}

                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-1 text-xs opacity-50 hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-black/5"
                >
                  {showCompleted ? <Eye size={14} /> : <EyeOff size={14} />}
                  {showCompleted ? "Show Completed" : "Hide Completed"}
                </button>
              </div>

              {/* Task List (ใช้ Component ใหม่) */}
              <div className="space-y-1">
                {currentProject.tasks.map(task => (
                  <TaskItem 
    key={task.id} 
    task={task}
    showCompleted={showCompleted}
    
    // --- เติมบรรทัดนี้ครับ ---
    isBlindEnabled={isBlindEnabled} 
    // ----------------------

    onToggle={(id) => projectTaskAction(currentProject.id, 'toggle', { id })}
    onUpdateText={(id, text) => projectTaskAction(currentProject.id, 'text', { id, text })}
    onDelete={(id) => projectTaskAction(currentProject.id, 'delete', { id })}
    onAddSubtask={(id) => projectTaskAction(currentProject.id, 'addSub', { id })}
    onToggleExpand={(id) => projectTaskAction(currentProject.id, 'expand', { id })}
    onAddSibling={(refId) => projectTaskAction(currentProject.id, 'addSibling', { refId })}
  />
                ))}

                {/* ปุ่มบวกใหญ่ด้านล่าง (สำหรับสร้าง Root Item ใหม่) */}
                <div className="flex items-center gap-3 mt-6 opacity-60 hover:opacity-100 transition-opacity pl-1 cursor-text"
                  onClick={() => document.getElementById('new-task-input')?.focus()}
                >
                  <Plus size={20} />
                  <input
                    id="new-task-input"
                    type="text"
                    placeholder="เพิ่มหัวข้อใหม่..."
                    className="bg-transparent border-none focus:ring-0 p-0 text-base w-full placeholder:text-current opacity-70"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        projectTaskAction(currentProject.id, 'add', { text: e.currentTarget.value });
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
                onChange={(e) => updateProject(currentProject.id, { description: e.target.value })}
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