This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, create a new `.env` file from `.env.example` and add your OpenAI API key found [here](https://platform.openai.com/account/api-keys).

```bash
cp .env.example .env
```

Next, we'll need to load our data source.

### Data Ingestion

Data ingestion happens in two steps. 

First, you should run

```bash
pip install -r ingest/requirements.txt
sh ingest/download.sh
````

This will download our data source (in this case the Langchain docs ) and parse it.

Next, install dependencies and run the ingestion script:
```bash
yarn && yarn ingest
```

This will split text, create embeddings, store them in a vectorstore, and
then save it to the `data/` directory.

We save it to a directory because we only want to run the (expensive) data ingestion process once. 

The Next.js server relies on the presence of the `data/` directory. Please
make sure to run this before moving on to the next step.

### Running the Server

Then, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Inspirations

This repo borrows heavily from 

- [ChatLangChain](https://github.com/hwchase17/chat-langchain) - for the backend and data ingestion logic
- [LangChain Chat NextJS](https://github.com/zahidkhawaja/langchain-chat-nextjs) - for the frontend.

## How To Run on Your Example

If you'd like to chat your own data, you need to:

1. Set up your own ingestion pipeline, and create a similar `data/` directory with a vectorstore in it.
2. Change the prompt used in `pages/api/util.ts` - right now this tells the chatbot to only respond to questions about LangChain, so in order to get it to work on your data you'll need to update it accordingly.

The server should work just the same 😄
