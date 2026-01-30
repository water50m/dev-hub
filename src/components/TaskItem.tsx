// components/TaskItem.tsx
import { ChevronRight, ChevronDown, CheckSquare, Square, CornerDownRight, X } from "lucide-react";
import { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  depth?: number;
  showCompleted: boolean;
  isBlindEnabled: boolean;
  parentIsCompleted?: boolean; // <--- 1. รับค่าสถานะแม่เพิ่ม
  onToggle: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (parentId: string) => void;
  onToggleExpand: (id: string) => void;
  onAddSibling: (refId: string) => void;
}

export default function TaskItem({ 
  task, 
  depth = 0, 
  showCompleted, 
  isBlindEnabled, 
  parentIsCompleted = true, // Default เป็น true สำหรับ Root (เพื่อให้ Root ซ่อนได้ปกติ)
  ...actions 
}: TaskItemProps) {

  // --- Logic การซ่อน (หัวใจสำคัญ) ---
  const shouldHide = !showCompleted && task.isCompleted;
  
  // ข้อยกเว้น: ถ้าเป็นลูกน้อง (depth > 0) และแม่ยังไม่เสร็จ -> "ห้ามซ่อน"
  const forceShow = depth > 0 && !parentIsCompleted;

  if (shouldHide && !forceShow) {
    // ถ้าอยู่ในโหมด Spec (ปิด Blind) เรามักอยากเห็นหมด
    // แต่ถ้า Blind เปิดอยู่ ก็ซ่อนเลย
    if (isBlindEnabled) return null;
  }
  // ------------------------------
  // Helper: ฟังก์ชันสำหรับย้าย Focus
  const moveFocus = (currentInput: HTMLInputElement, direction: 'up' | 'down') => {
    const allInputs = Array.from(document.querySelectorAll('.task-input')) as HTMLInputElement[];
    const currentIndex = allInputs.indexOf(currentInput);
    
    if (currentIndex === -1) return;

    let targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < allInputs.length) {
      const targetInput = allInputs[targetIndex];
      targetInput.focus();
      
      // (Optional) ย้าย Cursor ไปไว้ท้ายสุดเสมอ (เหมือน Notion/VSCode)
      // ถ้าไม่ต้องการ (อยากให้จำตำแหน่งเดิม) ให้ลบ setTimeout นี้ออก
      setTimeout(() => {
        targetInput.setSelectionRange(targetInput.value.length, targetInput.value.length);
      }, 0);
    }
  };
  return (
    <div className="flex flex-col select-none animate-in fade-in duration-300">
      <div 
        className="flex items-center gap-2 group py-1"
        style={{ paddingLeft: `${depth * 24}px` }}
      >
        {/* Toggle Expand Button */}
        <button 
          onClick={() => actions.onToggleExpand(task.id)}
          className={`p-0.5 rounded hover:bg-black/5 transition-colors ${!task.subtasks?.length ? 'opacity-0 pointer-events-none' : ''}`}
        >
          {task.isExpanded ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
        </button>

        {/* Checkbox */}
        <button 
          onClick={() => actions.onToggle(task.id)}
          className={`transition-colors flex-shrink-0 
            ${task.isCompleted ? 'text-green-500' : 'opacity-40 hover:opacity-100'}
            
          `}
        >
          {task.isCompleted ? <CheckSquare size={20} /> : <Square size={20} />}
        </button>
        
        {/* Input Text */}
        <input 
          type="text" 
          value={task.text}
          onChange={(e) => actions.onUpdateText(task.id, e.target.value)}
          className={`task-input w-full bg-transparent border-none focus:ring-0 p-0 text-base transition-all
             ${task.isCompleted 
                ? (isBlindEnabled 
                    ? 'opacity-30 blur-[0.5px] line-through decoration-transparent' 
                    : '') 
                : ''
             } 
          `}
          onKeyDown={(e) => {
            const input = e.currentTarget;

             if (e.key === 'Enter') {
              e.preventDefault();
              actions.onAddSibling(task.id);
              
              // ใช้ setTimeout เพื่อรอให้ React สร้าง DOM ตัวใหม่เสร็จก่อน แล้วค่อยย้าย Focus
              setTimeout(() => {
                moveFocus(input, 'down');
              }, 0);
            }

            // Arrow Up: ย้ายไปบรรทัดบน
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              moveFocus(input, 'up');
            }

            // Arrow Down: ย้ายไปบรรทัดล่าง
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              moveFocus(input, 'down');
            }

            if (e.key === 'Escape') { 
              if (task.text.trim() === '') {
                e.preventDefault();
                const allInputs = Array.from(document.querySelectorAll('.task-input'));
                const currentIndex = allInputs.indexOf(e.currentTarget);
                if (currentIndex > 0) (allInputs[currentIndex - 1] as HTMLInputElement).focus();
                actions.onDelete(task.id);
              } else {
                e.currentTarget.blur();
              }
            }
          }}
          style={{ 
             color: 'var(--text-primary)',
             backgroundImage: (task.isCompleted && isBlindEnabled) ? 'linear-gradient(currentColor, currentColor)' : 'none',
             backgroundSize: '100% 2px',
             backgroundRepeat: 'no-repeat',
             backgroundPosition: '0 56%' ,

             opacity: 1
          }}
          placeholder={depth === 0 ? "หัวข้อหลัก..." : "รายการย่อย..."}
        />

        {/* Actions Hover */}
         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
          <button onClick={() => actions.onAddSubtask(task.id)} className="text-blue-400 p-1 hover:bg-blue-50 rounded"><CornerDownRight size={14} /></button>
          <button onClick={() => actions.onDelete(task.id)} className="text-red-400 p-1 hover:bg-red-50 rounded"><X size={14} /></button>
        </div>
      </div>

      {/* Recursive Render Subtasks */}
      {task.isExpanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="flex flex-col border-l ml-[22px]" style={{ borderColor: 'var(--border)' }}>
          {task.subtasks.map(subtask => (
            <TaskItem 
              key={subtask.id} 
              task={subtask} 
              depth={depth + 1}
              showCompleted={showCompleted}
              isBlindEnabled={isBlindEnabled}
              parentIsCompleted={task.isCompleted} // <--- 2. ส่งสถานะตัวเองไปบอกลูก
              {...actions}
            />
          ))}
        </div>
      )}
    </div>
  );
}