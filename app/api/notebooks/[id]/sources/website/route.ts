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

    const { websiteUrl } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json(
        { error: "Website URL is required" },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid website URL format" },
        { status: 400 }
      );
    }

    const notebookId = params.id;

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
        sourceTitle: `Website: ${new URL(websiteUrl).hostname}`,
        type: "website",
        url: websiteUrl,
        status: "PROCESSING",
        notebookId: notebookId,
      },
    });

    // Send event to Inngest for processing
    await inngest.send({
      name: "notebook/create-source-from-website-url",
      data: {
        notebookId,
        userId: user.id,
        websiteUrl,
        sourceId: source.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Website added successfully",
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
    console.error("Error adding website source:", error);
    return NextResponse.json(
      { error: "Failed to add website" },
      { status: 500 }
    );
  }
}
