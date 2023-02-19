// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path';
import fs from 'fs';
import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { makeChain } from "./util";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body;
  const dir = path.resolve(process.cwd(), 'data');
  try {
    console.log(fs.readdirSync(process.cwd()))
  } catch (e) {
    console.log("Failed to read cwd");
  }

  try {
    console.log(fs.readdirSync(dir))
  } catch (e) {
    console.log("Failed to read data dir");
  }
  const vectorstore = await HNSWLib.load(dir, new OpenAIEmbeddings())
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    // Important to set no-transform to avoid compression, which will delay
    // writing response chunks to the client.
    // See https://github.com/vercel/next.js/issues/9965
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });

  const sendData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  }

  sendData(JSON.stringify({ data: "" }));
  const chain = makeChain(vectorstore, (token: string) => {
    sendData(JSON.stringify({ data: token }));
  });

  try {
    await chain.call({
      question: body.question,
      chat_history: body.history,
    });
    sendData("[DONE]");
    res.end();
  } catch (e) {
    res.end();
  }
}
