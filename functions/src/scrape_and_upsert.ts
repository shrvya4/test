import axios from 'axios';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

if (!FIRECRAWL_API_KEY || !OPENAI_API_KEY || !PINECONE_API_KEY || !PINECONE_ENVIRONMENT || !PINECONE_INDEX) {
  throw new Error('Missing one or more required environment variables.');
}

const researchPaperUrls = [
  // Add or update URLs as needed
  'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3279108/', // PCOS example
  'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8091993/', // Thyroid example
  // ... add more URLs for your topics
];

const CHUNK_SIZE = 1000; // characters per chunk

async function fetchPaperContent(url: string): Promise<{ title: string; text: string }> {
  const response = await axios.post(
    'https://api.firecrawl.dev/v1/scrape',
    { url },
    { headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` } }
  );
  const data = response.data;
  return {
    title: data.title || url,
    text: data.text || '',
  };
}

function chunkText(text: string, chunkSize: number): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

async function embedText(openai: OpenAI, text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

async function upsertToPinecone(index: any, vectors: any[]) {
  // Pinecone expects {id, values, metadata}[]
  await index.upsert(vectors);
}

async function main() {
  const pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY!,
  });
  const index = pinecone.Index(PINECONE_INDEX!);
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  for (const url of researchPaperUrls) {
    try {
      console.log(`Scraping: ${url}`);
      const { title, text } = await fetchPaperContent(url);
      if (!text) {
        console.warn(`No text found for ${url}`);
        continue;
      }
      const chunks = chunkText(text, CHUNK_SIZE);
      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await embedText(openai, chunk);
        vectors.push({
          id: `${url}#${i}`,
          values: embedding,
          metadata: {
            url,
            title,
            chunk_index: i,
            text: chunk.slice(0, 200), // store a snippet for reference
          },
        });
        console.log(`Embedded chunk ${i + 1}/${chunks.length} for ${url}`);
      }
      await upsertToPinecone(index, vectors);
      console.log(`Upserted ${vectors.length} vectors for ${url}`);
    } catch (err) {
      console.error(`Error processing ${url}:`, err);
    }
  }
}

if (require.main === module) {
  main().then(() => console.log('Done!')).catch(console.error);
} 