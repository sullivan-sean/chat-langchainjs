// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { makeChain } from "./util";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body;
  const vectorstore = await HNSWLib.load("data", new OpenAIEmbeddings())
  const chain = makeChain(vectorstore);
  
  const result = await chain.call({
    question: body.question,
    chat_history: body.history,
  });
  
  res.status(200).json({ result })
}
