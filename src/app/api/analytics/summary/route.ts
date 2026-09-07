// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const aggregations = await prisma.transaction.groupBy({
      by: ["type"],
      where: { userId },
      _sum: { amount: true },
    });

    const { searchParams } = new URL(request.url);
    const months = Math.max(1, parseInt(searchParams.get("months") || "6", 10));

    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: since } },
      select: { amount: true, type: true, category: true, date: true },
    });

    const byCategory = new Map<string, number>();
    const byMonth = new Map<string, { income: number; expense: number }>();

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      const monthKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;

      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, { income: 0, expense: 0 });
      }
      const monthBucket = byMonth.get(monthKey)!;

      if (tx.type === "EXPENSE") {
        monthBucket.expense += amount;
        byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + amount);
      } else {
        monthBucket.income += amount;
      }
    }

    const categoryBreakdown = Array.from(byCategory.entries())
      .map(([category, total]) => ({
        category,
        total: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total);

    const monthlyTrend = Array.from(byMonth.entries())
      .map(([month, v]) => ({
        month,
        income: Math.round(v.income * 100) / 100,
        expense: Math.round(v.expense * 100) / 100,
        net: Math.round((v.income - v.expense) * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalIncome = monthlyTrend.reduce((s, m) => s + m.income, 0);
    const totalExpense = monthlyTrend.reduce((s, m) => s + m.expense, 0);

    return NextResponse.json({
      success: true,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netSavings: Math.round((totalIncome - totalExpense) * 100) / 100,
      categoryBreakdown,
      monthlyTrend: [],
    });

  } catch (error) {
    console.error("Failed to generate analytics summary:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
