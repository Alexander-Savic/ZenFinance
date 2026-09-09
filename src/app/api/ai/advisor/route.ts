import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { authOptions } from '@/lib/auth';
import { computeAnalyticsSummary } from '@/lib/analytics';
import { AdvisorResponse, AdvisorTip, AnalyticsSummary } from '@/types/finance';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function generateFallbackTips(summary: AnalyticsSummary): AdvisorTip[] {
  const tips: AdvisorTip[] = [];

  if (summary.totalIncome > 0) {
    const savingsRatio = summary.netSavings / summary.totalIncome;
    if (savingsRatio < 0.1) {
      tips.push({
        id: 'tip-savings-low',
        title: 'Низкая норма сбережений',
        detail: `Вы сохраняете менее 10% дохода (сейчас ${Math.max(0, Math.round(savingsRatio * 100))}%). Старайтесь откладывать хотя бы 15–20% сразу при получении дохода.`,
        severity: 'warning',
      });
    } else if (savingsRatio >= 0.2) {
      tips.push({
        id: 'tip-savings-good',
        title: 'Отличный уровень накоплений',
        detail: `Вы откладываете ${Math.round(savingsRatio * 100)}% дохода. Это отличный показатель для формирования финансовой подушки.`,
        severity: 'positive',
      });
    }
  }

  if (summary.categoryBreakdown && summary.categoryBreakdown.length > 0) {
    const sortedCategories = [...summary.categoryBreakdown].sort((a, b) => {
      const valA = (a as any).value ?? (a as any).amount ?? 0;
      const valB = (b as any).value ?? (b as any).amount ?? 0;
      return valB - valA;
    });

    const topCategory = sortedCategories[0];
    const categoryName = (topCategory as any).name ?? (topCategory as any).category ?? 'Прочее';

    tips.push({
      id: 'tip-top-category',
      title: `Оптимизация: ${categoryName}`,
      detail: `Категория «${categoryName}» занимает наибольшую долю расходов. Попробуйте установить месячный лимит для этой категории.`,
      severity: 'info',
    });
  }

  if (summary.netSavings < 0) {
    tips.push({
      id: 'tip-deficit',
      title: 'Превышение расходов над доходами',
      detail: `За последние месяцы ваши расходы превысили доход на ${Math.abs(summary.netSavings)}. Просмотрите регулярные подписки и необязательные траты.`,
      severity: 'warning',
    });
  } else if (tips.length < 3) {
    tips.push({
      id: 'tip-general-budget',
      title: 'Правило 50/30/20',
      detail: 'Распределяйте бюджет: 50% на базовые потребности, 30% на личные желания и 20% на накопления и инвестиции.',
      severity: 'info',
    });
  }

  return tips.slice(0, 3);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const summary = await computeAnalyticsSummary(userId, 3);

  if (!summary || !summary.categoryBreakdown?.length) {
    const fallback: AdvisorResponse = {
      tips: [
        {
          id: 'no-data',
          title: 'Недостаточно данных',
          detail: 'Импортируйте выписку или добавьте несколько транзакций, чтобы мы могли проанализировать ваши расходы.',
          severity: 'info',
        },
      ],
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(fallback);
  }

  if (client && process.env.OPENAI_API_KEY) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a concise personal financial advisor. Respond in Russian language. Given a spending summary, produce exactly 3 short, specific, actionable recommendations. Reference concrete numbers and category names from the data. Respond ONLY with valid JSON: {"tips": [{"id": string, "title": string, "detail": string, "severity": "info" | "warning" | "positive"}]}. "warning" for overspending risks, "positive" for good habits worth reinforcing, "info" for general tips. No extra text.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              totalIncome: summary.totalIncome,
              totalExpense: summary.totalExpense,
              netSavings: summary.netSavings,
              categoryBreakdown: summary.categoryBreakdown,
              monthlyTrend: summary.monthlyTrend,
            }),
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content) as { tips: AdvisorTip[] };
        const tips: AdvisorTip[] = parsed.tips.slice(0, 3).map((tip, index) => ({
          id: tip.id ?? `tip-${index}`,
          title: tip.title,
          detail: tip.detail,
          severity: ['info', 'warning', 'positive'].includes(tip.severity) ? tip.severity : 'info',
        }));

        return NextResponse.json({
          tips,
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('⚠️ OpenAI Advisor API error, falling back to local tips generator:', error?.message || error);
    }
  }

  const fallbackTips = generateFallbackTips(summary);
  return NextResponse.json({
    tips: fallbackTips,
    generatedAt: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}