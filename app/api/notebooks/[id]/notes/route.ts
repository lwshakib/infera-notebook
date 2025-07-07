import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const notebookId = (await params).id;
    const body = await req.json();
    const noteInput = body.note;
    if (!noteInput || typeof noteInput !== "string" || !noteInput.trim()) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    // Trigger Inngest function to process and save the note
    await inngest.send({
      name: "notebook/create-note",
      data: {
        notebookId,
        userId: user.id,
        note: noteInput,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in notes POST:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save note" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const notebookId = (await params).id;
    // Verify notebook exists and belongs to user
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        clerkId: user.id,
      },
    });
    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }
    // Fetch notes for the notebook
    const notes = await prisma.note.findMany({
      where: { notebookId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notebookId = params.id;
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    // Verify notebook exists and belongs to user
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        clerkId: user.id,
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    // Delete the note
    await prisma.note.delete({
      where: {
        id: noteId,
        notebookId: notebookId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
