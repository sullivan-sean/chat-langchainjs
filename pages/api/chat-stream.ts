// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Server as HttpServer } from "http";
import type { Server as HttpsServer } from "https";
import { WebSocketServer } from 'ws';
import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { makeChain } from "./util";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if ((res.socket as any).server.wss) {
    res.end();
    return;
  }

  const server = (res.socket as any).server as HttpsServer | HttpServer;
  const wss = new WebSocketServer({ noServer: true });
  (res.socket as any).server.wss = wss;
  
  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.includes('/_next/webpack-hmr')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (ws) => {
    const sendResponse = ({ sender, message, type }: { sender: string, message: string, type: string }) => {
      ws.send(JSON.stringify({ sender, message, type }));
    };

    const onNewToken = (token: string) => {
      sendResponse({ sender: 'bot', message: token, type: 'stream' });
    }

    const chainPromise = HNSWLib.load("data", new OpenAIEmbeddings()).then((vs) => makeChain(vs, onNewToken));
    const chatHistory: [string, string][] = [];
    const encoder = new TextEncoder();


    ws.on('message', async (data) => {
      try {
        const question = data.toString();
        sendResponse({ sender: 'you', message: question, type: 'stream' });

        sendResponse({ sender: 'bot', message: "", type: 'start' });
        const chain = await chainPromise;

        const result = await chain.call({
            question,
            chat_history: chatHistory,
        });
        chatHistory.push([question, result.answer]);

        sendResponse({ sender: 'bot', message: "", type: 'end' });
      } catch (e) {
        sendResponse({
            sender: 'bot',
            message: "Sorry, something went wrong. Try again.",
            type: 'error'
        });
      }
    })
  });

  res.end();
}
