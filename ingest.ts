import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from 'fs';
import { Document } from "langchain/document";
import {BaseDocumentLoader} from "langchain/document_loaders";
import path from "path";
import {load} from "cheerio"
import util from "util";
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

class ReadTheDocsLoader extends BaseDocumentLoader {
  constructor(public filePath: string) {
    super();

  }
  async load(): Promise<Document[]> {
    const docs: Document[] = [];
    const files = await readdir(this.filePath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(this.filePath, file.name);
      if (file.isDirectory() || !(await util.promisify(fs.stat)(filePath)).isFile()) {
        continue;
      }
      const text = load(await readFile(filePath, 'utf-8')).text();
      const metadata = { source: filePath };
      docs.push(new Document({ pageContent: text, metadata: metadata }));
    }
    return docs
  }
}

const directoryPath = 'langchain.readthedocs.io';
const loader = new ReadTheDocsLoader(directoryPath);
const rawDocs = loader.load();
console.log("Vector store created.");

/* Split the text into chunks */
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});
rawDocs.then(rdocs => {
  const docs = textSplitter.splitDocuments(rdocs);
  console.log("Vector store created.");

  console.log("Creating vector store...");
  /* Create the vectorstore */
  const vectorStore = HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  vectorStore.then((value) => (value.save("data")))
  console.log("Vector store created.");
})

