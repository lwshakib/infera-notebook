import { Storage } from "@google-cloud/storage";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { GoogleGenAI } from "@google/genai";
import { TaskType } from "@google/generative-ai";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import mime from "mime-types";
import { googleApiKey } from "../config";
import { prisma } from "../prisma";
import { inngest } from "./client";
// @ts-ignore

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004", // 768 dimensions
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document title",
  apiKey: process.env.GOOGLE_API_KEY,
});

export const processFiles = inngest.createFunction(
  { id: "upload-files" },
  { event: "notebook/upload-files" },
  async ({ event, step }) => {
    const { notebookId, userId, uploadedUrls } = event.data;

    const processing = await step.run("processing", async () => {
      // Add to vector store
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          collectionName: "infera-notebooks-chunks",
          apiKey: process.env.QDRANT_API_KEY,
        }
      );
      let data: any[] = [];
      for (const uploadUrlObj of uploadedUrls) {
        // Fetch the file from the remote URL
        const response = await fetch(uploadUrlObj.url);
        if (!response.ok)
          throw new Error(`Failed to fetch file: ${uploadUrlObj.url}`);
        const arrayBuffer = await response.arrayBuffer();

        // Determine file type
        const fileType =
          uploadUrlObj.fileType ||
          mime.lookup(uploadUrlObj.url) ||
          "application/pdf";
        let loader;
        let docs;
        if (fileType === "application/pdf") {
          // Create a Blob from the arrayBuffer
          const fileBlob = new Blob([arrayBuffer], { type: fileType });
          loader = new WebPDFLoader(fileBlob, {});
          docs = await loader.load();
        } else if (fileType === "text/csv") {
          // Create a Blob from the arrayBuffer and use CSVLoader
          const fileBlob = new Blob([arrayBuffer], { type: fileType });
          loader = new CSVLoader(fileBlob);
          docs = await loader.load();
        } else if (
          fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          // DOCX - create Blob and use it directly
          const fileBlob = new Blob([arrayBuffer], { type: fileType });
          loader = new DocxLoader(fileBlob);
          docs = await loader.load();
        } else if (fileType === "application/msword") {
          // DOC - create Blob and use it directly
          const fileBlob = new Blob([arrayBuffer], { type: fileType });
          loader = new DocxLoader(fileBlob, { type: "doc" });
          docs = await loader.load();
        } else if (fileType === "application/json") {
          // Create a Blob from the arrayBuffer and use JSONLoader
          const fileBlob = new Blob([arrayBuffer], { type: fileType });
          loader = new JSONLoader(fileBlob);
          docs = await loader.load();
        } else {
          // Fallback: skip unsupported types for now
          continue;
        }
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 50,
        });
        const texts = await textSplitter.splitDocuments(docs as any);

        // Add sourceId and userId to metadata for each document
        const textsWithMetadata = texts.map((doc) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            sourceId: uploadUrlObj.id,
            userId: userId,
            notebookId: notebookId, // Added notebookId to metadata
          },
        }));

        await vectorStore.addDocuments(textsWithMetadata);
        // Update status to COMPLETED in the database
        if (uploadUrlObj.id) {
          const source = await prisma.source.update({
            where: { id: uploadUrlObj.id },
            data: { status: "COMPLETED" },
          });
          data.push(source as any);
        }
      }
      return data;
    });

    const logUploads = await step.run("log-uploads", async () => {
      return uploadedUrls;
    });

    return {
      success: true,
      processing,
    };
  }
);

export const createSourceFromYoutubeUrl = inngest.createFunction(
  { id: "create-source-from-youtube-url" },
  { event: "notebook/create-source-from-youtube-url" },
  async ({ event, step }) => {
    const { notebookId, userId, youtubeUrl, sourceId } = event.data;
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        collectionName: "infera-notebooks-chunks",
        apiKey: process.env.QDRANT_API_KEY,
      }
    );
    const loader = YoutubeLoader.createFromUrl(youtubeUrl, {
      language: "en",
      addVideoInfo: true,
    });
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 50,
    });
    const texts = await textSplitter.splitDocuments(docs as any);

    // Add sourceId and userId to metadata for each document
    const textsWithMetadata = texts.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        sourceId: sourceId,
        userId: userId,
        notebookId: notebookId, // Added notebookId to metadata
      },
    }));

    await vectorStore.addDocuments(textsWithMetadata);
    const updatedSource = await prisma.source.update({
      where: { id: sourceId },
      data: { status: "COMPLETED", sourceTitle: docs[0].metadata.title },
    });
    return updatedSource;
  }
);

export const createSourceFromWebsiteUrl = inngest.createFunction(
  { id: "create-source-from-website-url" },
  { event: "notebook/create-source-from-website-url" },
  async ({ event, step }) => {
    const { notebookId, userId, websiteUrl, sourceId } = event.data;
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        collectionName: "infera-notebooks-chunks",
        apiKey: process.env.QDRANT_API_KEY,
      }
    );

    const updatedSource = await prisma.source.update({
      where: { id: sourceId },
      data: {
        status: "COMPLETED",
        sourceTitle: `Website: ${new URL(websiteUrl).hostname}`,
      },
    });
    return updatedSource;
  }
);

export const createPodcast = inngest.createFunction(
  { id: "create-podcast" },
  { event: "notebook/podcast" },
  async ({ event, step }) => {
    const { notebookId, selectedSources } = event.data;

    const updateAudioOverview = await step.run("updatedb", async () => {
      await prisma.notebook.update({
        where: {
          id: notebookId,
        },
        data: {
          audioOverview: {
            hasAudioOverview: true,
            status: "PROCESSING",
          },
        },
      });
    });

    // Connect to the vector store
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        collectionName: "infera-notebooks-chunks",
        apiKey: process.env.QDRANT_API_KEY,
      }
    );

    // Build filter for selected source IDs
    const filter = {
      must: [{ key: "metadata.sourceId", match: { any: selectedSources } }],
    };

    // Fetch all chunks for the selected sources
    const allChunks = await vectorStore.similaritySearch("", 1000, filter);
    const allTexts = allChunks.map((doc: any) => doc.pageContent);

    // Limit to 2000 words total
    let wordCount = 0;
    const limitedTexts: string[] = [];
    for (const text of allTexts) {
      const words = text.split(/\s+/);
      if (wordCount + words.length > 2000) {
        // Add only the remaining words to reach 2000
        const remaining = 2000 - wordCount;
        if (remaining > 0) {
          limitedTexts.push(words.slice(0, remaining).join(" "));
        }
        break;
      } else {
        limitedTexts.push(text);
        wordCount += words.length;
      }
    }

    // --- Step 1: Generate Podcast Script ---
    const podcastScript = await step.run(
      "generate-podcast-script",
      async () => {
        const podcastPrompt = `You are a world-class podcast script generator creating engaging, insightful, and polished dialogues for a forward-thinking global audience.

Generate a well-structured podcast script featuring two consistent hosts, without mentioning names or gender explicitly.

Style and Tone:
The dialogue should be natural, dynamic, intellectually stimulating, yet accessible and fun to attract a broad audience. Use a professional but warm and approachable voice.

Instructions:
- The podcast opens with a welcoming introduction starting exactly as:
  First host: "Welcome to the Podcast. I am host Emma and with me today is another person."
  Second host: "Hi, I am David The cohost of the podcast."
- The first host then clearly and simply introduces the episode topic, sparking curiosity.
- Hosts alternate naturally, balancing insightful commentary with relatable examples, anecdotes, or light humor to engage listeners.
- Include occasional light-hearted moments, myth-busting, or fun facts to build rapport.
- Use an intelligent, professional, yet friendly tone throughout.
- Maintain consistent voice assignment: use "en-US-Wavenet-F" for the first host and "en-US-Wavenet-D" for the second.
- Structure the script into clear segments: Introduction, Topic Introduction, Deep Dive, Summary, and Closing.
- End with a motivating closing statement encouraging curiosity and engagement.
- Keep language clear and concise, avoiding jargon, to make the podcast accessible and inviting.
- Do not include any SSML tags in the output; provide plain text only.

Output format:
Return JSON only, with this structure:

{
  "title": "",
  "segments": [
    {
      "content": "...",
      "voice": "en-US-Wavenet-F"
    },
    {
      "content": "...",
      "voice": "en-US-Wavenet-D"
    }
  ]
}`;
        const ai = new GoogleGenAI({ apiKey: googleApiKey });
        let rawOutput = "";
        try {
          const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: limitedTexts.join("\n\n"),
            config: {
              systemInstruction: podcastPrompt,
            },
          });
          rawOutput = response.text ?? "";
          const data = rawOutput.replace(/```json|```/g, "").trim();
          return JSON.parse(data);
        } catch (error) {
          console.error("❌ Failed to parse JSON:", (error as Error).message);
          console.log("🔍 Raw output:", rawOutput);
          throw error;
        }
      }
    );

    // --- Step 2: Synthesize and upload each segment, collect URLs ---
    const segmentUrls = await step.run(
      "synthesize-and-upload-segments",
      async () => {
        const textToSpeechClient = new TextToSpeechClient();
        const storage = new Storage();
        const bucketName = "infera-notebook";
        const safeTitle = podcastScript.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:.]/g, "-");
        const urls: string[] = [];
        for (const [i, segment] of podcastScript.segments.entries()) {
          const request = {
            input: { text: segment.content },
            voice: { languageCode: "en-US", name: segment.voice },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 1.05,
              pitch: 2.0,
              volumeGainDb: 1.0,
            },
          };
          const [response] = await textToSpeechClient.synthesizeSpeech(
            request as any
          );
          if (!response.audioContent)
            throw new Error("No audio content returned from TTS");
          const fileName = `uploads/${safeTitle}_${timestamp}_segment${i}.mp3`;
          const file = storage.bucket(bucketName).file(fileName);
          await file.save(Buffer.from(response.audioContent), {
            contentType: "audio/mpeg",
            resumable: false,
          });
          urls.push(
            `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(fileName)}`
          );
        }
        return urls;
      }
    );

    // --- Step 3: Download, merge, and upload merged podcast file ---
    const audioUrl = await step.run(
      "download-merge-upload-segments",
      async () => {
        const storage = new Storage();
        const bucketName = "infera-notebook";
        const buffers: Buffer[] = [];
        for (const url of segmentUrls) {
          const fileName = decodeURIComponent(url.split("/").pop()!);
          const file = storage.bucket(bucketName).file(fileName);
          const [data] = await file.download();
          buffers.push(data as Buffer);
        }
        const mergedBuffer = Buffer.concat(buffers);

        // Upload merged buffer here
        const safeTitle = podcastScript.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:.]/g, "-");
        const outputFileName = `uploads/${safeTitle}_${timestamp}.mp3`;
        const file = storage.bucket(bucketName).file(outputFileName);
        await file.save(mergedBuffer, {
          contentType: "audio/mpeg",
          resumable: false,
        });
        return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(outputFileName)}`;
      }
    );

    const updateAudioOverview2 = await step.run("updatedb2", async () => {
      await prisma.notebook.update({
        where: {
          id: notebookId,
        },
        data: {
          audioOverview: {
            hasAudioOverview: true,
            status: "COMPLETED",
            audioUrl: audioUrl,
            audioTitle: podcastScript.title,
          },
        },
      });
    });

    return {
      notebookId,
      selectedSources,
      script: podcastScript,
      segmentUrls,
      audioUrl,
    };
  }
);

export const createNote = inngest.createFunction(
  { id: "create-note" },
  { event: "notebook/create-note" },
  async ({ event, step }) => {
    const { notebookId, userId, note } = event.data;

    // Step 1: Create the note with notebookId only
    const savedNote = await step.run("create-note-record", async () => {
      return await prisma.note.create({
        data: {
          notebookId: notebookId,
        },
      });
    });

    // Step 2: Generate a nice title using GoogleGenAI
    const title = await step.run("generate-title", async () => {
      const ai = new GoogleGenAI({ apiKey: googleApiKey });
      const titleRes = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Create a compelling and succinct title that captures the essence of this note: ${note}. Respond with only the title as plain text. Do not include any explanations or formatting.
`,
      });
      return titleRes.text?.trim() || "Untitled Note";
    });

    // Step 3: Generate a detailed note using GoogleGenAI
    const content = await step.run("generate-content", async () => {
      const ai = new GoogleGenAI({ apiKey: googleApiKey });
      const detailRes = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Transform the following brief note, based on the prompt below, into a detailed and well-structured explanation.  
Format the output using **Markdown** for clear and professional presentation.  
Return **only** the formatted content—no additional commentary or explanations.  
Ensure the explanation is clear, logically organized, and strictly based on the given note without adding any extra information.  
Provide a small summary first, followed by detailed content, all in pure markdown text without headers.  
Note: ${note}`,
      });
      return detailRes.text?.trim() || note;
    });

    // Step 4: Update the note with title, content, and status
    const updateNote = await step.run("update-note-record", async () => {
      return await prisma.note.update({
        where: {
          id: savedNote.id,
        },
        data: {
          title,
          content,
          status: "COMPLETED",
        },
      });
    });

    return updateNote;
  }
);

export const deleteSourceVectorData = inngest.createFunction(
  { id: "delete-source-vector-data" },
  { event: "notebook/delete-source-vector-data" },
  async ({ event, step }) => {
    const { sourceId, notebookId, userId } = event.data;

    const deletedVectors = await step.run("delete-vectors", async () => {
      // Connect to the vector store
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          collectionName: "infera-notebooks-chunks",
          apiKey: process.env.QDRANT_API_KEY,
        }
      );

      // Delete all vectors that match the sourceId
      await vectorStore.delete({
        filter: {
          must: [
            {
              key: "metadata.sourceId",
              match: {
                value: sourceId,
              },
            },
          ],
        },
      });
    });

    return {
      success: true,
      sourceId,
    };
  }
);

export const processTextContent = inngest.createFunction(
  { id: "process-text-content" },
  { event: "notebook/process-text-content" },
  async ({ event, step }) => {
    const { sourceId, notebookId, userId, textContent } = event.data;

    // Log the text content
    console.log("Processing text content for source:", sourceId);
    console.log("Text content:", textContent);

    // Step 1: Generate title using AI
    const title = await step.run("generate-title", async () => {
      const ai = new GoogleGenAI({ apiKey: googleApiKey });
      const titleRes = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Create a compelling and succinct title that captures the essence of this text content. The title should be descriptive, professional, and under 60 characters. Respond with only the title as plain text. Do not include any explanations, quotes, or formatting.

Text content: ${textContent.substring(0, 1000)}${textContent.length > 1000 ? "..." : ""}`,
      });
      return titleRes.text?.trim() || "Text Document";
    });

    // Step 2: Prepare text chunks for vector store
    const textChunks = await step.run("prepare-text-chunks", async () => {
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 50,
      });

      // Create a simple document structure
      const docs = [
        {
          pageContent: textContent,
          metadata: {
            sourceId: sourceId,
            userId: userId,
            notebookId: notebookId,
            type: "text",
          },
        },
      ];

      // Split the text into chunks
      const texts = await textSplitter.splitDocuments(docs as any);

      // Add metadata to each chunk
      const textsWithMetadata = texts.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          sourceId: sourceId,
          userId: userId,
          notebookId: notebookId,
        },
      }));

      return textsWithMetadata;
    });

    // Step 3: Add documents to vector store
    const vectorStoreResult = await step.run(
      "add-to-vector-store",
      async () => {
        const vectorStore = await QdrantVectorStore.fromExistingCollection(
          embeddings,
          {
            url: process.env.QDRANT_URL,
            collectionName: "infera-notebooks-chunks",
            apiKey: process.env.QDRANT_API_KEY,
          }
        );

        // Add documents to vector store
        await vectorStore.addDocuments(textChunks);

        return {
          chunksAdded: textChunks.length,
          sourceId: sourceId,
        };
      }
    );

    // Step 4: Update source in database
    const updatedSource = await step.run("update-source-status", async () => {
      return await prisma.source.update({
        where: { id: sourceId },
        data: {
          status: "COMPLETED",
          sourceTitle: title,
        },
      });
    });

    return {
      success: true,
      source: updatedSource,
      vectorStoreResult,
      title,
    };
  }
);
