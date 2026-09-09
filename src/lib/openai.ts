export const openai = {
  chat: {
    completions: {
      create: async () => ({ choices: [{ message: { content: "{}" } }] })
    }
  }
} as any;
