function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (typeof key !== "string") {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return key;
}

export interface EmbeddingData {
  object: string;
  index: number;
  embedding: number[];
}

export interface Embeddings {
  data: EmbeddingData[];
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export async function generateEmbeddings(content: string): Promise<Embeddings> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAIApiKey()}`,
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: content,
    }),
  });

  const data = await res.json();
  console.log(data);
  return data as Embeddings;
}
