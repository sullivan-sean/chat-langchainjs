import { OpenAI } from "langchain/llms/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  LLMChain,
  ConversationalRetrievalQAChain,
  loadQAStuffChain,
} from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";
import { CallbackManager } from "langchain/callbacks";
import { AIChatMessage, HumanChatMessage } from "langchain/schema";

const CONDENSE_PROMPT = ChatPromptTemplate.fromPromptMessages(
  [
    SystemMessagePromptTemplate.fromTemplate(
    `Given the following conversation between a user and an assistant, rephrase the last question from the user to be a standalone question.`
    ),
    new MessagesPlaceholder("chat_history"),
    HumanMessagePromptTemplate.fromTemplate(`Last question: {question}`),
  ],
);

const QA_PROMPT = PromptTemplate.fromTemplate(
  `You are an AI assistant for the open source library LangChain. The documentation is located at https://docs.langchain.com/docs/.
You are given the following extracted parts of a long document and a question. Provide a conversational answer with a hyperlink to the documentation.
You should only use hyperlinks that are explicitly listed as a source in the context. Do NOT make up a hyperlink that is not listed.
If the question includes a request for code, provide a code block directly from the documentation.
If you don't know the answer, just say "Hmm, I'm not sure." Don't try to make up an answer.
If the question is not about LangChain, politely inform them that you are tuned to only answer questions about LangChain.
Question: {question}
=========
{context}
=========
Answer in Markdown:`
);

export const makeChain = (
  vectorstore: HNSWLib,
  onTokenStream?: (token: string) => Promise<void>
) => {
  const questionGenerator = new LLMChain({
    llm: new OpenAI({
      azureOpenAIApiDeploymentName: 'gpt-35-turbo', // Azure OpenAI API deployment name
      temperature: 0,
    }),
    prompt: CONDENSE_PROMPT,
  });
  const docChain = loadQAStuffChain(
    new ChatOpenAI({
      azureOpenAIApiDeploymentName: 'gpt-35-turbo', // Azure OpenAI API deployment name
      temperature: 0,
      streaming: Boolean(onTokenStream),
      callbackManager: CallbackManager.fromHandlers({
        handleLLMNewToken: onTokenStream,
      }),
    }),
    { prompt: QA_PROMPT }
  );

  return new ConversationalRetrievalQAChain({
    retriever: vectorstore.asRetriever(),
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true
  });
}

export const formatHistory = (history: [string, string][]) =>
  history.flatMap(([q, a]) => [new HumanChatMessage(q), new AIChatMessage(a)]);
