export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/projects/[id]/todos/[todoId] - Update a todo
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; todoId: string } }
) {
  try {
    const { todoId } = params;
    const body = await req.json();
    const { title, completed, dueDate, assignedTo } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    const todo = await prisma.todoItem.update({
      where: { id: todoId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        children: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ todo }, { status: 200 });
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/todos/[todoId] - Delete a todo
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; todoId: string } }
) {
  try {
    const { todoId } = params;

    await prisma.todoItem.delete({
      where: { id: todoId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 }
    );
  }
}

