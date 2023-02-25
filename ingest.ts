import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from 'fs';
import { Document } from "langchain/document";
import { BaseDocumentLoader } from "langchain/document_loaders";
import path from "path";
import { load } from "cheerio"

async function processFile(filePath: string): Promise<Document> {
  return await new Promise<Document>((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, fileContents) => {
      if (err) {
        reject(err);
      } else {
        const text = load(fileContents).text();
        const metadata = { source: filePath };
        const doc = new Document({ pageContent: text, metadata: metadata });
        resolve(doc);
      }
    });
  });
}

async function processDirectory(directoryPath: string): Promise<Document[]> {
  const docs: Document[] = [];
  const files = fs.readdirSync(directoryPath);
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const newDocs = processDirectory(filePath);
      const nestedDocs = await newDocs;
      docs.push(...nestedDocs);
    } else {
      const newDoc = processFile(filePath);
      const doc = await newDoc;
      docs.push(doc);
    }
  }
  return docs;
}


class ReadTheDocsLoader extends BaseDocumentLoader {
  constructor(public filePath: string) {
    super();

  }
  async load(): Promise<Document[]> {
    return await processDirectory(this.filePath);
  }
}

const directoryPath = 'langchain.readthedocs.io';
const loader = new ReadTheDocsLoader(directoryPath);


export const run = async () => {
  const rawDocs = await loader.load();
  console.log("Vector store created.");
  /* Split the text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
  });
  const docs = textSplitter.splitDocuments(rawDocs);
  console.log("Vector store created.");

  console.log("Creating vector store...");
  /* Create the vectorstore */
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  vectorStore.save("data")
}

(async () => {
  await run();
  console.log("done")
})();