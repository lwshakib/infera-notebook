import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import {
  createMindMap,
  createNote,
  createPodcast,
  createSourceFromWebsiteUrl,
  createSourceFromYoutubeUrl,
  deleteSourceVectorData,
  processFiles,
  processTextContent,
} from "@/lib/inngest/functions";

// Create an API that serves all functions except helloWorld
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processFiles,
    createPodcast,
    createNote,
    createSourceFromYoutubeUrl,
    createSourceFromWebsiteUrl,
    deleteSourceVectorData,
    processTextContent,
    createMindMap
  ],
});
