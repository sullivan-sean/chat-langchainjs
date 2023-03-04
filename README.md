This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, create a new `.env` file from `.env.example` and add your OpenAI API key found [here](https://platform.openai.com/account/api-keys).

```bash
cp .env.example .env
```

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v16 or higher)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)
- `wget` (on macOS, you can install this with `brew install wget`)

Next, we'll need to load our data source.

### Data Ingestion

Data ingestion happens in two steps.

First, you should run

```bash
sh download.sh
```

This will download our data source (in this case the Langchain docs ).

Next, install dependencies and run the ingestion script:

```bash
yarn && yarn ingest
```

_Note: If on Node v16, use `NODE_OPTIONS='--experimental-fetch' yarn ingest`_

This will parse the data, split text, create embeddings, store them in a vectorstore, and
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

### Deploying the server

The production version of this repo is hosted on
[fly](https://chat-langchainjs.fly.dev/). To deploy your own server on Fly, you
can use the provided `fly.toml` and `Dockerfile` as a starting point.

**Note:** As a Next.js app it seems like Vercel is a natural place to
host this site. Unfortunately there are
[limitations](https://github.com/websockets/ws/issues/1786#issuecomment-678315435)
to secure websockets using `ws` with Next.js which requires using a custom
server which cannot be hosted on Vercel. Even using server side events, it
seems, Vercel's serverless functions seem to prohibit streaming responses
(e.g. see
[here](https://github.com/vercel/next.js/issues/9965#issuecomment-820156947))

## Inspirations

This repo borrows heavily from

- [ChatLangChain](https://github.com/hwchase17/chat-langchain) - for the backend and data ingestion logic
- [LangChain Chat NextJS](https://github.com/zahidkhawaja/langchain-chat-nextjs) - for the frontend.

## How To Run on Your Example

If you'd like to chat your own data, you need to:

1. Set up your own ingestion pipeline, and create a similar `data/` directory with a vectorstore in it.
2. Change the prompt used in `pages/api/util.ts` - right now this tells the chatbot to only respond to questions about LangChain, so in order to get it to work on your data you'll need to update it accordingly.

The server should work just the same 😄
