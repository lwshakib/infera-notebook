import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notebookId = (await params).id;
    const { youtubeUrl, websiteUrl } = await request.json();

    // Check if it's a YouTube URL or website URL
    const isYouTubeUrl = (url: string) => {
      return url.includes("youtube.com") || url.includes("youtu.be");
    };

    let url: string;
    let urlType: string;

    if (youtubeUrl) {
      url = youtubeUrl;
      urlType = "youtube";
    } else if (websiteUrl) {
      url = websiteUrl;
      urlType = "website";
    } else {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { error: "Valid URL is required" },
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

    // Create a source record in the database
    const sourceTitle =
      urlType === "youtube"
        ? `YouTube: ${url}`
        : `Website: ${new URL(url).hostname}`;

    const source = await prisma.source.create({
      data: {
        sourceTitle: sourceTitle,
        type: urlType,
        url: url,
        notebookId: notebookId,
      },
    });

    // Trigger appropriate Inngest function based on URL type
    if (urlType === "youtube") {
      await inngest.send({
        name: "notebook/create-source-from-youtube-url",
        data: {
          notebookId,
          userId: user.id,
          youtubeUrl: url,
          sourceId: source.id,
        },
      });
    } else {
      await inngest.send({
        name: "notebook/create-source-from-website-url",
        data: {
          notebookId,
          userId: user.id,
          websiteUrl: url,
          sourceId: source.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      source: {
        id: source.id,
        sourceTitle: source.sourceTitle,
        type: source.type,
        url: source.url,
        createdAt: source.createdAt,
      },
      message: `${urlType === "youtube" ? "YouTube video" : "Website"} added successfully`,
    });
  } catch (error) {
    console.error("Error adding URL source:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
