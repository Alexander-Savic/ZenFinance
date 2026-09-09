import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Указываем, что params — это Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Распаковываем params через await
    const { id: accountId } = await params;

    if (!accountId) {
      return NextResponse.json({ message: 'ID счёта не указан' }, { status: 400 });
    }

    // Проверяем, принадлежит ли счёт текущему пользователю
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { message: 'Счёт не найден или недоступен' },
        { status: 404 }
      );
    }

    // Удаляем связанные транзакции
    await prisma.transaction.deleteMany({
      where: { accountId },
    });

    // Удаляем сам счёт
    await prisma.account.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true, id: accountId });
  } catch (error) {
    console.error('DELETE /api/accounts/[id] error:', error);
    return NextResponse.json(
      { message: 'Не удалось удалить счёт' },
      { status: 500 }
    );
  }
}