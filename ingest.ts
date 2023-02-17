import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from 'fs';
import { Document } from "langchain/document";

const directoryPath = 'ingest/ingested_data';
const rawDocs: Document[] = []

const filenames = fs.readdirSync(directoryPath);
  

filenames.forEach(file => {
    if (file.endsWith('.json')) {
        const filePath = `${directoryPath}/${file}`;
  
        const data = fs.readFileSync(filePath,'utf8')
        const obj = JSON.parse(data);
        const _doc = new Document({pageContent: obj["page_content"], metadata: obj["metadata"] })
        rawDocs.push(_doc)
      }
});
/* Split the text into chunks */
const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
const docs = textSplitter.splitDocuments(rawDocs);
/* Create the vectorstore */
const vectorStore = HNSWLib.fromDocuments(
  docs,
  new OpenAIEmbeddings()
  );
vectorStore.then(
    (value) => (value.save("data"))
)
