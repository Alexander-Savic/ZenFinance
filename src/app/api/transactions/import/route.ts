import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { parseStatementFile } from "../../../../utils/statement-parser";
import { categorizeTransactions } from "../../../../utils/ai-categorizer";
 
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
 
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["text/csv", "application/vnd.ms-excel", "text/plain"];
 
class ImportError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ImportError";
  }
}
 
export async function POST(request: NextRequest) {
  try {
    // 💡 Автоматически извлекаем или создаем демо-пользователя в Neon PostgreSQL
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { email: "demo@zenfinance.com", passwordHash: "demo_hash" }
      });
    }
    const userId = user.id;
 
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Request must be sent as multipart/form-data." },
        { status: 400 }
      );
    }
 
    const file = formData.get("file");
    
    // Автоматически находим или создаем счет
    let account = await prisma.account.findFirst({ where: { userId } });
    if (!account) {
      account = await prisma.account.create({
        data: { userId, name: "Основной счет", type: "BANK", currency: "USD", balance: 0 }
      });
    }
 
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing required 'file' field in form data." },
        { status: 400 }
      );
    }
 
    if (file.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }
 
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size.` },
        { status: 413 }
      );
    }
 
    const looksLikeCsvName = file.name.toLowerCase().endsWith(".csv");
    const looksLikeXlsxName = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");
    
    if (!looksLikeCsvName && !looksLikeXlsxName) {
      return NextResponse.json(
        { error: "Only .csv, .xls, or .xlsx files are supported." },
        { status: 400 }
      );
    }
 
    // Читаем контент файла в буфер
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
 
    // 1. Вызываем наш парсер утилит
    const parsedRows = parseStatementFile(buffer, file.name);
 
    // 2. Формируем массив для нашего локального ИИ-анализатора
    const categorizationInputs = parsedRows.map((row, index) => ({
      id: String(index),
      description: row.description,
      amount: row.amount,
      type: row.type,
    }));
 
    // 3. Распределяем по умным категориям
    const categorizedResults = await categorizeTransactions(categorizationInputs);
    const categoryMap = new Map<string, string>();
    categorizedResults.forEach((r) => categoryMap.set(r.id, r.category));
 
    // 4. Безопасно сохраняем транзакции в базу данных одной SQL-транзакцией
    const createdCount = await prisma.$transaction(async (tx: any) => {
      const result = await tx.transaction.createMany({
        data: parsedRows.map((row, index) => ({
          userId,
          accountId: account!.id,
          date: row.date,
          amount: row.amount,
          description: row.description,
          // Указываем обязательный тип транзакции
          type: row.type, 
          category: categoryMap.get(String(index)) ?? "Other",
          isAIClassified: true,
        })),
      });
      return result.count;
    });
 
    // 5. Перерасчитываем итоговый баланс аккаунта
    const aggregations = await prisma.transaction.groupBy({
      by: ["type"],
      where: { accountId: account.id },
      _sum: { amount: true },
    });
 
    const income = Number(aggregations.find((a) => a.type === "INCOME")?._sum.amount ?? 0);
    const expense = Number(aggregations.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0);
 
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: income - expense },
    });
 
    return NextResponse.json(
      {
        message: "Import completed.",
        imported: createdCount,
        skippedRows: 0,
        rowErrors: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error during transaction import:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while importing transactions." },
      { status: 500 }
    );
  }
}
