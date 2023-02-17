This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Data Ingestion

Data ingestion happens in two steps. 

First, you should `cd ingest` and run `sh ingest.sh`. This will load and parse data.

Next, you should come back to the top level and install dependencies with `yarn dev` and then run the data ingestion script with `npx ts-node ingest.ts`. This will split text, create embeddings, store them in a vectorstore, and then save it to a directory.
We save it to a directory because we only want to run the data ingestion process once. 

The backend server relies on this data ingestion being done and this data being saved. Please make sure to run this before moving on to the next step.

## Getting Started

First, create a new `.env` file from `.env.example` and add your OpenAI API key found [here](https://platform.openai.com/account/api-keys).

```bash
cp .env.example .env
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Inspirations

This repo borrows heavily from 

- [ChatLangChain](https://github.com/hwchase17/chat-langchain) - for the backend and data ingestion logic
- [LangChain Chat NextJS](https://github.com/zahidkhawaja/langchain-chat-nextjs) - for the frontend.
