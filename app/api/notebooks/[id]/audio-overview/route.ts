import { inngest } from "@/lib/inngest/client";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let notebookId = params.id;
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let selectedSources: string[] = [];
  try {
    const body = await request.json();
    selectedSources = body.selectedSources || [];
    if (body.notebookId) notebookId = body.notebookId;
  } catch (e) {
    // fallback: no sources provided
  }
  // Trigger Inngest podcast creation
  await inngest.send({
    name: "notebook/podcast",
    data: {
      notebookId,
      userId: user.id,
      selectedSources,
    },
  });
  return NextResponse.json({
    success: true,
    message: "Audio overview creation started.",
  });
}
