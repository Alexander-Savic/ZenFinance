import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseStatementFile } from "@/utils/statement-parser";
import { categorizeTransactions } from "@/utils/ai-categorizer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Извлекаем реальный ID авторизованного пользователя
    const userId = (session.user as { id: string }).id;

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
        { error: "File exceeds maximum allowed size (5MB)." },
        { status: 413 }
      );
    }

    const looksLikeCsvName = file.name.toLowerCase().endsWith(".csv");
    const looksLikeXlsxName =
      file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls");

    if (!looksLikeCsvName && !looksLikeXlsxName) {
      return NextResponse.json(
        { error: "Only .csv, .xls, or .xlsx files are supported." },
        { status: 400 }
      );
    }

    let account = await prisma.account.findFirst({ where: { userId } });
    if (!account) {
      account = await prisma.account.create({
        data: { userId, name: "Основной счет", type: "BANK", currency: "USD", balance: 0 },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedRows = parseStatementFile(buffer, file.name);

    if (!parsedRows || parsedRows.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found in the statement file." },
        { status: 400 }
      );
    }

    const categorizationInputs = parsedRows.map((row, index) => ({
      id: String(index),
      description: row.description,
      amount: row.amount,
      type: row.type,
    }));

    const categorizedResults = await categorizeTransactions(categorizationInputs);
    const categoryMap = new Map<string, string>();
    categorizedResults.forEach((r) => categoryMap.set(r.id, r.category));

    const createdCount = await prisma.$transaction(async (tx) => {
      const result = await tx.transaction.createMany({
        data: parsedRows.map((row, index) => ({
          userId,
          accountId: account.id,
          date: row.date,
          amount: row.amount,
          description: row.description,
          type: row.type,
          category: categoryMap.get(String(index)) ?? "Other",
          isAIClassified: true,
        })),
      });
      return result.count;
    });

    const aggregations = await prisma.transaction.groupBy({
      by: ["type"],
      where: { accountId: account.id },
      _sum: { amount: true },
    });

    const income = Number(
      aggregations.find((a) => a.type === "INCOME")?._sum.amount ?? 0
    );
    const expense = Number(
      aggregations.find((a) => a.type === "EXPENSE")?._sum.amount ?? 0
    );

    await prisma.account.update({
      where: { id: account.id },
      data: { balance: income - expense },
    });

    return NextResponse.json(
      {
        success: true,
        totalImported: createdCount,
        aiClassifiedCount: categorizedResults.length,
        message: "Import completed successfully.",
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