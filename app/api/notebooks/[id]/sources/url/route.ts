import { inngest } from "@/lib/inngest/client";
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
    const { selectedDiscoverySources } = await request.json();

    const array = selectedDiscoverySources.map((item: any) => {
      return {
        sourceTitle: item.title,
        type: "application/pdf",
        url: item.url,
        notebookId,
      };
    });

    // Create sources and get their IDs
    const createdSources = await Promise.all(
      array.map(async (sourceData: any) => {
        return await prisma?.source.create({
          data: sourceData,
        });
      })
    );



    await inngest.send({
      name: "notebook/upload-files",
      data: {
        notebookId,
        userId: user.id,
        uploadedUrls: createdSources,
      },
    });

    // Handle bulk import of discovery sources

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error adding URL source:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
