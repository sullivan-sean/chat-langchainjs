import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from "fs";
import { Document } from "langchain/document";
import { BaseDocumentLoader } from "langchain/document_loaders/base";
import path from "path";
import { load } from "cheerio";

async function processFile(filePath: string): Promise<Document> {
  return await new Promise<Document>((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, fileContents) => {
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
  let files: string[];
  try {
    files = fs.readdirSync(directoryPath);
  } catch (err) {
    console.error(err);
    throw new Error(
      `Could not read directory: ${directoryPath}. Did you run \`sh download.sh\`?`
    );
  }
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

const directoryPath = "docs.langchain.com";
const loader = new ReadTheDocsLoader(directoryPath);

export const run = async () => {
  const rawDocs = await loader.load();
  console.log("Loader created.");
  /* Split the text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await textSplitter.splitDocuments(rawDocs);
  console.log("Docs splitted.");

  console.log("Creating vector store...");
  /* Create the vectorstore */
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings({
    azureOpenAIApiDeploymentName: 'text-embedding-ada-002', // Azure OpenAI deployment name
  }));
  await vectorStore.save("data");
};

(async () => {
  await run();
  console.log("done");
})();
