import { useState, useRef, useEffect, useMemo } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import CircularProgress from '@mui/material/CircularProgress';

type Message = {
  type: "apiMessage" | "userMessage";
  message: string;
  isStreaming?: boolean;
}

const getWebsocketUrl = () => {
  const origin = window.location.origin;
  const secure = origin.startsWith("https");
  const protocol = secure ? "wss" : "ws";
  return `${protocol}://${window.location.host}/api`
}

export default function Home() {

  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [{ messages, pending }, setMessageState] = useState<{ messages: Message[], pending?: string }>({
    messages: [{
      "message": "Hi there! How can I help?",
      "type": "apiMessage"
    }],
  });

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [messages]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);


  const socketInitializer = async () => {
    await fetch('/api/chat-stream');
    const ws = new WebSocket(getWebsocketUrl());

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.sender === "bot") {
        if (data.type === "start") {
          setMessageState(state => ({ ...state, pending: "" }));
        } else if (data.type === "stream") {
          setMessageState(state => ({
            ...state,
            pending: (state.pending ?? "") + data.message
          }));
        } else if (data.type === "end") {
          setMessageState(state => ({
            messages: [...state.messages, {
              type: "apiMessage",
              message: state.pending ?? "",
            }],
            pending: undefined
          }));
          setLoading(false);
        } else if (data.type === "error") {
          setMessageState(state => ({
            messages: [...state.messages, {
              type: "apiMessage",
              message: data.message,
            }],
            pending: undefined
          }));
          setLoading(false);
        }
      } else {
        setMessageState(state => ({
          messages: [...state.messages, {
            type: "userMessage",
            message: data.message
          }],
          pending: undefined
        }))
      }
    }
    return ws;
  }


  useEffect(() => {
    socketInitializer().then(setWebsocket);
  }, []);

  // Handle form submission
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const question = userInput.trim();
    if (question === "") {
      return;
    }

    websocket?.send(question);
    setLoading(true);
    setUserInput("");
  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e: any) => {
    if (e.key === "Enter" && userInput) {
      if(!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const chatMessages = useMemo(() => {
    return [...messages, ...(pending ? [{ type: "apiMessage", message: pending }] : [])];
  }, [messages, pending]);

  return (
    <>
      <Head>
        <title>LangChain Chat</title>
        <meta name="description" content="LangChain documentation chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
        <div className = {styles.navlogo}>
          <Link href="/">LangChain</Link>
        </div>
        <div className = {styles.navlinks}>
          <a
            href="https://langchain.readthedocs.io/en/latest/"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
          <a
            href="https://github.com/zahidkhawaja/langchain-chat-nextjs"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {chatMessages.map((message, index) => {
              let icon;
              let className;

              if (message.type === "apiMessage") {
                icon = <Image src="/parroticon.png" alt="AI" width="30" height="30" className={styles.boticon} priority />;
                className = styles.apimessage;
              } else {
                icon = <Image src="/usericon.png" alt="Me" width="30" height="30" className={styles.usericon} priority />

                // The latest message sent by the user will be animated while waiting for a response
                className = loading && index === chatMessages.length - 1
                  ? styles.usermessagewaiting
                  : styles.usermessage;
              }
              return (
                  <div key={index} className={className}>
                    {icon}
                    <div className = {styles.markdownanswer}>
                      <ReactMarkdown linkTarget="_blank">{message.message}</ReactMarkdown>
                    </div>
                  </div>
              )
            })}
          </div>
        </div>
        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea 
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                id="userInput" 
                name="userInput" 
                placeholder={loading? "Waiting for response..." : "Type your question..."}  
                value={userInput} 
                onChange={e => setUserInput(e.target.value)} 
                className={styles.textarea}
              />
              <button 
                type="submit" 
                disabled = {loading}
                className = {styles.generatebutton}
              >
                {loading ? (
                  <div className={styles.loadingwheel}>
                    <CircularProgress color="inherit" size={20}/>
                  </div>
                ) : (
                  // Send icon SVG in input field
                  <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
          <div className = {styles.footer}>
            <p>Powered by
              <a
                href="https://github.com/hwchase17/langchain"
                target="_blank"
                rel="noreferrer"
              >
                LangChain
              </a>. Built by <a href="https://twitter.com/chillzaza_" target="_blank" rel="noreferrer">Zahid</a> and <a href="https://twitter.com/_seanyneutron" target="_blank" rel="noreferrer">Sean</a>.</p>
          </div>
        </div>
      </main>
    </>
  )
}
