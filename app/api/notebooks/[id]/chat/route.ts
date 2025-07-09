import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { TaskType } from "@google/generative-ai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { NextRequest, NextResponse } from "next/server";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004", // 768 dimensions
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document title",
  apiKey: process.env.GOOGLE_API_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { message, selectedSources } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Notebook ID is required" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check notebook ownership
    const notebook = await prisma.notebook.findUnique({ where: { id } });
    if (!notebook || notebook.clerkId !== user.id) {
      return NextResponse.json(
        { error: "Notebook not found or unauthorized" },
        { status: 404 }
      );
    }

    // Save user's message
    await prisma.chatMessage.create({
      data: {
        sender: "user",
        message,
        notebookId: id,
      },
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        collectionName: "infera-notebooks-chunks",
        apiKey: process.env.QDRANT_API_KEY,
      }
    );

    // Build Qdrant filter
    const filter: any = {
      must: [
        { key: "metadata.notebookId", match: { value: id } },
        { key: "metadata.userId", match: { value: user.id } },
        {
          key: "metadata.sourceId",
          match: { any: selectedSources },
        },
      ],
    };

    const results = await vectorStore.similaritySearch(message, 3, {
      must: filter.must,
    });

    const contextText = results
      .map(
        (s) =>
          `Content: ${s.pageContent}\nMetadata: ${JSON.stringify(
            s.metadata,
            null,
            2
          )}`
      )
      .join("\n\n");

    const chatHistory = await prisma.chatMessage.findMany({
      where: { notebookId: id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        message: true,
        sender: true,
      },
    });

    const formattedHistory = chatHistory
      .map(
        (msg) =>
          `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.message}`
      )
      .join("\n");

    const prompt = ChatPromptTemplate.fromTemplate(
      `You are an assistant with an encouraging tone.

Use Chat History, Context, and Question.

Chat History:
{history}

Context:
{context}

Question:
{question}

Instructions:
- If the answer is found in the context or history, respond briefly and clearly.
- If the information is not available, reply: "I'm sorry, this information is not available in the provided context."
- If the question is unclear, request clarification politely.
- For greetings, respond appropriately and warmly.
- Don't need filler texts like Hi, Hello If this is not a greetings conversation

Tone:
- Maintain a clear, precise, and encouraging tone throughout the response.`
    );

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GOOGLE_API_KEY!,
    });

    const chain = prompt.pipe(llm);

    const response = await chain.invoke({
      context: contextText,
      question: message,
      history: formattedHistory,
    });

    function getStringContent(content: any): string {
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        return content
          .map((part) => (typeof part === "string" ? part : ""))
          .join(" ")
          .trim();
      }
      return String(content);
    }

    const assistantMessage = getStringContent(response.content);

    await prisma.chatMessage.create({
      data: {
        sender: "assistant",
        message: assistantMessage,
        notebookId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Error processing chat message:", {
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
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

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Notebook ID is required" },
        { status: 400 }
      );
    }

    const notebook = await prisma.notebook.findUnique({ where: { id } });
    if (!notebook || notebook.clerkId !== user.id) {
      return NextResponse.json(
        { error: "Notebook not found or unauthorized" },
        { status: 404 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { notebookId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching chat messages:", {
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
