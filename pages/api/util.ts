import { ChatOpenAI } from "langchain/chat_models";
import {
  LLMChain,
  ChatVectorDBQAChain,
  loadQAStuffChain,
} from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";
import { CallbackManager } from "langchain/callbacks";

const CONDENSE_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
  
  Chat History:
  {chat_history}`),
  HumanMessagePromptTemplate.fromTemplate(`{question}`),
]);

const QA_PROMPT = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(`You are an AI assistant for the open source library LangChain. The documentation is located at https://langchain.readthedocs.io.
You are given the following extracted parts of a long document and a question. Provide a conversational answer with a hyperlink to the documentation.
You should only use hyperlinks that are explicitly listed as a source in the context. Do NOT make up a hyperlink that is not listed.
If the question includes a request for code, provide a code block directly from the documentation.
If you don't know the answer, just say "Hmm, I'm not sure." Don't try to make up an answer.
If the question is not about LangChain, politely inform them that you are tuned to only answer questions about LangChain.
=========
{context}
=========
Always format your answer in Markdown.`),
  HumanMessagePromptTemplate.fromTemplate(`{question}`),
]);

export const makeChain = (
  vectorstore: HNSWLib,
  onTokenStream?: (token: string) => Promise<void>
) => {
  const questionGenerator = new LLMChain({
    llm: new ChatOpenAI({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAStuffChain(
    new ChatOpenAI({
      temperature: 0,
      streaming: Boolean(onTokenStream),
      callbackManager: CallbackManager.fromHandlers({
        handleLLMNewToken: onTokenStream,
      }),
    }),
    { prompt: QA_PROMPT }
  );

  return new ChatVectorDBQAChain({
    vectorstore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
  });
};
