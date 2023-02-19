// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path';
import fs from 'fs';
import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from 'langchain/embeddings';

import { OpenAI } from "langchain/llms";
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";

const CONDENSE_PROMPT = PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`);

const QA_PROMPT = PromptTemplate.fromTemplate(
`You are an AI assistant for the open source library LangChain. The documentation is located at https://langchain.readthedocs.io.
You are given the following extracted parts of a long document and a question. Provide a conversational answer with a hyperlink to the documentation.
You should only use hyperlinks that are explicitly listed as a source in the context. Do NOT make up a hyperlink that is not listed.
If the question includes a request for code, provide a code block directly from the documentation.
If you don't know the answer, just say "Hmm, I'm not sure." Don't try to make up an answer.
If the question is not about LangChain, politely inform them that you are tuned to only answer questions about LangChain.
Question: {question}
=========
{context}
=========
Answer in Markdown:`);

const makeChain = (vectorstore: HNSWLib, onTokenStream?: (token: string) => void) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAI({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAChain(
    new OpenAI({
      temperature: 0,
      streaming: Boolean(onTokenStream),
      callbackManager: {
        handleStart: (...args) => {
          console.log("LLMSTART", ...args);
        },
        handleEnd: (...args) => {
          console.log("LLMEND", ...args);
        },
        handleError: (...args) => {
          console.log("lLMErr", ...args);
        },
        handleNewToken: onTokenStream,
      }
    }),
    QA_PROMPT,
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
  });
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body;
  const dir = path.resolve(process.cwd(), 'data');

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
    console.log(`Sending ${data}`)
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
  } catch {
    // Ignore error
  } finally {
    sendData("[DONE]");
    res.end();
  }
}
