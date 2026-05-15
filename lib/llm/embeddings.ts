import type { EmbeddingsInterface } from '@langchain/core/embeddings';
import {
  EMBEDDING_MODEL_ID,
  GEMINI_EMBEDDING_BATCH_SIZE,
  GEMINI_EMBEDDING_DIMENSIONALITY,
} from '@/lib/constants';
import { GoogleGenAI } from '@google/genai';
import { GOOGLE_API_KEY } from './config';

/**
 * Gemini Embedding - Query (Asymmetric)
 * Uses the 'search_query' task type instruction as recommended for Gemini 2.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const google = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  const query = `task: search result | query: ${text}`;

  const response = await google.models.embedContent({
    model: EMBEDDING_MODEL_ID,
    contents: query,
    config: { outputDimensionality: GEMINI_EMBEDDING_DIMENSIONALITY },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding) {
    throw new Error('No embedding returned from Gemini API');
  }

  return embedding;
}

/**
 * Gemini Embedding - Documents (Asymmetric)
 * Uses the 'title: none | text: {content}' format for documents as recommended.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const google = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  const batchSize = GEMINI_EMBEDDING_BATCH_SIZE;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const batchPromises = batch.map((text) => {
      const doc = `title: none | text: ${text}`;
      return google.models.embedContent({
        model: EMBEDDING_MODEL_ID,
        contents: doc,
        config: { outputDimensionality: GEMINI_EMBEDDING_DIMENSIONALITY },
      });
    });

    const batchResponses = await Promise.all(batchPromises);
    const batchResults = batchResponses
      .map((response) => response.embeddings?.[0]?.values)
      .filter((values): values is number[] => Boolean(values));

    results.push(...batchResults);
  }

  return results;
}

/**
 * Functional embeddings implementation for LangChain vector stores.
 */
export const vectorEmbeddings: EmbeddingsInterface = {
  embedQuery,
  embedDocuments,
};
