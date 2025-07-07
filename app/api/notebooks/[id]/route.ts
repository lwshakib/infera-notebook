import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Notebook ID is required" },
        { status: 400 }
      );
    }

    const notebook = await prisma.notebook.findUnique({
      where: { id },
      select: {
        id: true,
        clerkId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        audioOverview:true
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(notebook);
  } catch (error) {
    console.error("Error fetching notebook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
