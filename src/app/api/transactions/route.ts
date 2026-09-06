import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // В MVP автоматически берем первого демо-пользователя
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { email: "demo@zenfinance.com", passwordHash: "demo_hash" },
      });
    }

    // Извлекаем параметры фильтрации и пагинации из URL
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const accountId = searchParams.get("accountId") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10));

    // Строим объект условий для SQL-запроса
    const where = {
      userId: user.id,
      ...(category ? { category } : {}),
      ...(accountId ? { accountId } : {}),
    };

    // Делаем параллельные запросы к бд для оптимизации скорости
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
