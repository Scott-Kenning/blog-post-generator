"use client";

import { useState, useRef, useEffect } from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

export default function ClientSection() {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string>("");
  const responseRef = useRef<HTMLDivElement>(null);

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(response)
      .then(() => {
        alert("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const generateResponse = async (input: string) => {
    setResponse("");
    setLoading(true);

    const finalPrompt = `
    Q: You are a professional blog writer for medium. Your new job is to create a blog post on the subject of ${input}.
    This post should be readable at a high school level, yet still be both interesting and informative.
    The blog post should be approximately 500 words in length.
    The blog post should use markdown formatting, but do not include any notes about the actual markdown formatting.
    Never include images.`;

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: finalPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setResponse((prev) => prev + chunkValue);
    }
    setLoading(false);
  };

  const handleFeedback = async (feedback: string) => {
    if (feedback === "perfect") {
      handleCopyToClipboard();
    } else {
      const adjustedPrompt = `PLease rewrite the following blog post based on the feedback that it was ${feedback}. Old blog psot: ${response}`;
      generateResponse(adjustedPrompt);
    }
  };

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  return (
    <div className="flex w-screen min-h-screen bg-neutral-100">
      <div className="w-full max-w-xl m-auto flex flex-col gap-8 mt-48">
        <h1 className="text-4xl font-bold">AI Powered Blog Post Generator</h1>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          maxLength={200}
          className="focus:ring-neu w-full rounded-md border border-neutral-400
        p-4 text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-neutral-900"
          placeholder={"Enter a subject"}
        />
        {!loading ? (
          <button
            className="w-full rounded-xl bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-black/80"
            onClick={() => generateResponse(input)}
          >
            Generate Response &rarr;
          </button>
        ) : (
          <button
            disabled
            className="w-full rounded-xl bg-neutral-900 px-4 py-2 font-medium text-white"
          >
            <div className="animate-pulse font-bold tracking-widest">...</div>
          </button>
        )}
        {response && (
          <div
            ref={responseRef}
            className="flex flex-col w-full mt-8 rounded-xl border bg-white p-4 shadow-md transition hover:bg-gray-100 prose"
          >
            <button
              onClick={handleCopyToClipboard}
              className="ml-auto bg-blue-500 text-white px-2 py-1 rounded mb-8"
            >
              Copy
            </button>
            <ReactMarkdown>{response}</ReactMarkdown>
            {!loading && (
              <div className="mt-4">
                <p>I think this post was ____</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    "too professional sounding",
                    "too casual in tone",
                    "not detailed enough",
                    "perfect",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleFeedback(option)}
                      className="px-4 py-2 rounded-md bg-blue-500 text-white"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
