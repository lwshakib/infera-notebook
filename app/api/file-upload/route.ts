import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Storage } from "@google-cloud/storage";
import { NextRequest, NextResponse } from "next/server";

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

const bucketName = "infera-notebook";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const notebookId = formData.get("notebookId") as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!notebookId) {
      return NextResponse.json(
        { error: "Notebook ID is required" },
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

    const uploadedSources = [];
    const uploadedUrls = [];

    for (const file of files) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "audio/mpeg",
        "application/json",
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not supported` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split(".").pop();
      const fileName = `${timestamp}-${randomString}.${fileExtension}`;
      const gcsFilePath = `uploads/${fileName}`;

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Google Cloud Storage
      const bucket = storage.bucket(bucketName);
      const fileUpload = bucket.file(gcsFilePath);

      await fileUpload.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: user.id,
            notebookId: notebookId,
          },
        },
      });

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFilePath}`;

      // Create source record in database
      const source = await prisma.source.create({
        data: {
          sourceTitle: file.name,
          type: "file",
          url: publicUrl,
          notebookId: notebookId,
        },
      });

      uploadedSources.push({
        id: source.id,
        sourceTitle: source.sourceTitle,
        type: source.type,
        url: source.url,
        createdAt: source.createdAt,
      });

      uploadedUrls.push({
        id: source.id, // Include file id for downstream processing
        originalName: file.name,
        url: publicUrl,
        fileName: fileName,
        fileType: file.type, // Add fileType for loader selection
      });
    }

    // Trigger Inngest function for logging
    await inngest.send({
      name: "notebook/upload-files",
      data: {
        notebookId,
        userId: user.id,
        uploadedUrls: uploadedUrls,
      },
    });

    return NextResponse.json({
      success: true,
      sources: uploadedSources,
      message: `${files.length} file(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
