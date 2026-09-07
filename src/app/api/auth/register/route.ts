import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../../../lib/prisma';

const registerSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email обязателен' })
    .trim()
    .toLowerCase()
    .email({ message: 'Некорректный формат email' }),
  password: z
    .string()
    .min(1, { message: 'Пароль обязателен' })
    .min(8, { message: 'Пароль должен содержать не менее 8 символов' })
    .max(100, { message: 'Пароль слишком длинный' }),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return NextResponse.json(
        { success: false, message: 'Некорректное или пустое тело запроса' },
        { status: 400 }
      );
    }

    // Валидация входных данных через Zod
    const validationResult = registerSchema.safeParse(rawBody);

    if (!validationResult.success) {
      // Собираем читаемый список ошибок по полям
      const formattedErrors = validationResult.error.flatten().fieldErrors;
      
      return NextResponse.json(
        {
          success: false,
          message: 'Ошибка валидации входных данных',
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    // Безопасно извлекаем валидированные и типизированные данные
    const { email, password } = validationResult.data;

    // Проверка на существование пользователя
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Пользователь с таким email уже зарегистрирован' },
        { status: 409 }
      );
    }

    // Хэширование пароля и создание пользователя
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Регистрация прошла успешно',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}