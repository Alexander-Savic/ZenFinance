// Заглушка, чтобы приложение не падало без ключа OpenAI
export const openai = {
  chat: {
    completions: {
      create: async () => ({ choices: [{ message: { content: "{}" } }] })
    }
  }
} as any;
