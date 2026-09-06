export interface CategorizationInput {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
}

export interface CategorizationResult {
  id: string;
  category: string;
}

// Правила локального ИИ-паpсера по ключевым словам
function getMockCategory(desc: string, type: string): string {
  const text = desc.toLowerCase();
  
  if (type === "INCOME" || text.includes("salary") || text.includes("payroll") || text.includes("deposit")) {
    return "Income";
  }
  if (text.includes("starbucks") || text.includes("pizza") || text.includes("coffee") || text.includes("magnit") || text.includes("pyaterochka") || text.includes("mcdonald")) {
    return "Food";
  }
  if (text.includes("uber") || text.includes("yandex") || text.includes("taxi") || text.includes("metro") || text.includes("gas") || text.includes("lyft")) {
    return "Transport";
  }
  if (text.includes("netflix") || text.includes("spotify") || text.includes("youtube") || text.includes("steam")) {
    return "Subscriptions";
  }
  if (text.includes("rent") || text.includes("apartment") || text.includes("housing")) {
    return "Housing";
  }
  if (text.includes("amazon") || text.includes("wildberries") || text.includes("ozon") || text.includes("shopping")) {
    return "Shopping";
  }
  if (text.includes("cinema") || text.includes("theatre") || text.includes("bar") || text.includes("club")) {
    return "Entertainment";
  }
  
  return "Other";
}

export async function categorizeTransactions(items: CategorizationInput[]): Promise<CategorizationResult[]> {
  if (!items.length) return [];

  // Имитируем небольшую задержку «мыслительного процесса» ИИ в 800 миллисекунд для красоты анимации
  await new Promise((resolve) => setTimeout(resolve, 800));

  return items.map((item) => ({
    id: item.id,
    category: getMockCategory(item.description, item.type),
  }));
}
