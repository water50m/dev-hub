import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Project } from '@/lib/types';

const dataPath = path.join(process.cwd(), 'data', 'projects.json');

// Helper อ่านไฟล์
async function getProjects(): Promise<Project[]> {
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // ถ้าไม่มีไฟล์ ให้สร้างไฟล์เปล่า
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, '[]', 'utf-8');
    return [];
  }
}

// GET: ดึงข้อมูลทั้งหมด
export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(projects);
}

// POST: บันทึกข้อมูล (รับ Array ใหม่ทั้งหมดมาทับของเดิมเพื่อความง่ายในการ Sync)
export async function POST(req: Request) {
  const newProjects: Project[] = await req.json();
  await fs.writeFile(dataPath, JSON.stringify(newProjects, null, 2), 'utf-8');
  return NextResponse.json({ success: true });
}