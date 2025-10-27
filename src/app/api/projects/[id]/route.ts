export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** DELETE /api/projects/:id — delete a project */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    console.log("Attempting to delete project:", id);
    
    // Check if project exists first
    const project = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!project) {
      console.log("Project not found:", id);
      return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
    }
    
    console.log("Project found, deleting:", project.title);
    
    // Delete the project (cascade will handle related records)
    const result = await prisma.project.delete({
      where: { id },
    });

    console.log("Project deleted successfully:", result.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Error deleting project:", e);
    console.error("Error code:", e.code);
    console.error("Error meta:", e.meta);
    return NextResponse.json({ ok: false, error: e?.message || "Failed to delete project" }, { status: 400 });
  }
}

