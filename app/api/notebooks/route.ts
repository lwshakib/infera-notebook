import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notebook = await prisma.notebook.create({
      data: {
        title: "Untitled notebook",
        clerkId: user.id,
      },
      include: {
        sources: true,
      },
    });

    return NextResponse.json({
      id: notebook.id,
      title: notebook.title,
      sources: notebook.sources.length,
      createdAt: notebook.createdAt,
      updatedAt: notebook.updatedAt,
    });
  } catch (error) {
    console.error("Error creating notebook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notebooks = await prisma.notebook.findMany({
      where: {
        clerkId: user.id,
      },
      include: {
        sources: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedNotebooks = notebooks.map((notebook) => ({
      id: notebook.id,
      title: notebook.title,
      sources: notebook.sources.length,
      createdAt: notebook.createdAt,
      updatedAt: notebook.updatedAt,
    }));

    return NextResponse.json(formattedNotebooks);
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title } = await request.json();

    if (
      !id ||
      !title ||
      typeof title !== "string" ||
      title.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Notebook ID and title are required" },
        { status: 400 }
      );
    }

    // Check if notebook exists and belongs to user
    const existingNotebook = await prisma.notebook.findFirst({
      where: {
        id,
        clerkId: user.id,
      },
    });

    if (!existingNotebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    const updatedNotebook = await prisma.notebook.update({
      where: { id },
      data: {
        title: title.trim(),
        updatedAt: new Date(),
      },
      include: {
        sources: true,
      },
    });

    return NextResponse.json({
      id: updatedNotebook.id,
      title: updatedNotebook.title,
      sources: updatedNotebook.sources.length,
      createdAt: updatedNotebook.createdAt,
      updatedAt: updatedNotebook.updatedAt,
    });
  } catch (error) {
    console.error("Error updating notebook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Notebook ID is required" },
        { status: 400 }
      );
    }

    // Check if notebook exists and belongs to user
    const existingNotebook = await prisma.notebook.findFirst({
      where: {
        id,
        clerkId: user.id,
      },
    });

    if (!existingNotebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    // Delete the notebook (this will cascade delete related records)
    await prisma.notebook.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notebook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
