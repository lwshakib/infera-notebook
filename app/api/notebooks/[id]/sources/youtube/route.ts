import { checkUser } from "@/lib/checkUser";
import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check user authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { youtubeUrl } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL format" },
        { status: 400 }
      );
    }

    const notebookId = (await params).id;

    

    // Verify notebook exists and user has access
    const notebook = await prisma.notebook.findUnique({
      where: {
        id: notebookId,
        clerkId: user.id,
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found or access denied" },
        { status: 404 }
      );
    }

    // Create source record in database
    const source = await prisma.source.create({
      data: {
        sourceTitle: `YouTube: ${youtubeUrl}`,
        type: "youtube",
        url: youtubeUrl,
        status: "PROCESSING",
        notebookId: notebookId,
      },
    });

    // Send event to Inngest for processing
    await inngest.send({
      name: "notebook/create-source-from-youtube-url",
      data: {
        notebookId,
        userId: user.id,
        youtubeUrl,
        sourceId: source.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "YouTube video added successfully",
      source: {
        id: source.id,
        sourceTitle: source.sourceTitle,
        type: source.type,
        url: source.url,
        status: source.status,
        createdAt: source.createdAt,
      },
    });
  } catch (error) {
    console.error("Error adding YouTube source:", error);
    return NextResponse.json(
      { error: "Failed to add YouTube video" },
      { status: 500 }
    );
  }
}
