import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

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

    // Fetch sources for the notebook
    const sources = await prisma.source.findMany({
      where: {
        notebookId: notebookId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      sources: sources,
    });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    // Verify source exists and belongs to user's notebook
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        notebook: {
          clerkId: user.id,
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Delete the source
    await prisma.source.delete({
      where: { id: sourceId },
    });

    // Trigger Inngest function to delete vector data
    await inngest.send({
      name: "notebook/delete-source-vector-data",
      data: {
        sourceId,
        notebookId: (await params).id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting source:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sourceId, sourceTitle } = await request.json();

    if (
      !sourceId ||
      !sourceTitle ||
      typeof sourceTitle !== "string" ||
      sourceTitle.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Source ID and title are required" },
        { status: 400 }
      );
    }

    // Verify source exists and belongs to user's notebook
    const existingSource = await prisma.source.findFirst({
      where: {
        id: sourceId,
        notebook: {
          clerkId: user.id,
        },
      },
    });

    if (!existingSource) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Update the source
    const updatedSource = await prisma.source.update({
      where: { id: sourceId },
      data: {
        sourceTitle: sourceTitle.trim(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      source: updatedSource,
    });
  } catch (error) {
    console.error("Error updating source:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
