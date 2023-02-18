import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from 'fs';
import { Document } from "langchain/document";

const directoryPath = 'ingested_data';
const rawDocs = fs.readdirSync(directoryPath)
  .filter(file => file.endsWith('.json'))
  .map(file => {
    const data = fs.readFileSync(`${directoryPath}/${file}`, 'utf8');
    const { page_content: pageContent, metadata } = JSON.parse(data);
    return new Document({ pageContent, metadata })
  });

/* Split the text into chunks */
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});
const docs = textSplitter.splitDocuments(rawDocs);

console.log("Creating vector store...");
/* Create the vectorstore */
const vectorStore = HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
vectorStore.then((value) => (value.save("data")))
