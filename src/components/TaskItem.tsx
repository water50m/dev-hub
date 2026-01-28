import { ChevronRight, ChevronDown, CheckSquare, Square, CornerDownRight, X } from "lucide-react";
import { Task } from "@/lib/types";

interface TaskItemProps {
  task: Task;
  depth?: number;
  // รับ prop เป็น Action กลาง
  onToggle: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (parentId: string) => void;
  onToggleExpand: (id: string) => void;
}

export default function TaskItem({ task, depth = 0, ...actions }: TaskItemProps) {


  return (
    <div className="flex flex-col select-none animate-in fade-in duration-300">
      <div 
        className="flex items-center gap-2 group py-1"
        style={{ paddingLeft: `${depth * 24}px` }} // ย่อหน้าตามระดับความลึก
      >
        {/* ปุ่มลูกศร ยืด/หด */}
        <button 
          onClick={() => actions.onToggleExpand(task.id)}
          className={`p-0.5 rounded hover:bg-black/5 transition-colors ${!task.subtasks?.length ? 'opacity-0 hover:opacity-100' : ''}`}
          title={task.isExpanded ? "Collapse" : "Expand"}
        >
          {task.isExpanded ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
        </button>

        {/* ปุ่ม Checkbox */}
        <button 
          onClick={() => actions.onToggle(task.id)}
          className={`transition-colors flex-shrink-0 ${task.isCompleted ? 'text-green-500' : 'opacity-40 hover:opacity-100'}`}
        >
          {task.isCompleted ? <CheckSquare size={20} /> : <Square size={20} />}
        </button>
        
        {/* ช่องกรอกข้อความ */}
        <input 
          type="text" 
          value={task.text}
          onChange={(e) => actions.onUpdateText(task.id, e.target.value)}
          className={`w-full bg-transparent border-none focus:ring-0 p-0 text-base transition-all
             ${task.isCompleted ? 'opacity-100 font-semibold' : ''} 
          `}
          style={{ 
            color: task.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
            backgroundImage: task.isCompleted ? 'linear-gradient(currentColor, currentColor)' : 'none',
            backgroundSize: '100% 2px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0 55%'
          }}
        />

        {/* ปุ่ม Action ด้านหลัง (Add Subtask / Delete) */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
          <button 
            onClick={() => actions.onAddSubtask(task.id)}
            className="text-blue-400 p-1 hover:bg-blue-50 rounded"
            title="Add Subtask"
          >
            <CornerDownRight size={14} />
          </button>
          <button 
            onClick={() => actions.onDelete(task.id)}
            className="text-red-400 p-1 hover:bg-red-50 rounded"
            title="Delete"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Render Subtasks Recursively (เรียกตัวเองซ้ำเพื่อแสดงลูกๆ) */}
      {task.isExpanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="flex flex-col border-l ml-[22px]" style={{ borderColor: 'var(--border)' }}>
          {task.subtasks.map(subtask => (
            <TaskItem 
              key={subtask.id} 
              task={subtask} 
              depth={depth + 1}
              {...actions} // *** จุดสำคัญ: ส่ง actions ชุดเดิมต่อไปให้ลูก ***
            />
          ))}
        </div>
      )}
    </div>
  );
}