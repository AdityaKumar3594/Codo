import { ChatOpenRouter } from "@langchain/openrouter";

const llm = new ChatOpenRouter({
  model: "deepseek/deepseek-chat-v3-0324",
  temperature: 0,
  maxTokens: 8192,
});

export default llm;