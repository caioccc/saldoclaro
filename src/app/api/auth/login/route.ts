import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ensureDatabaseSchema, prisma } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth";
import { createId } from "@/utils/id";

export async function POST(request: Request) {
  let credentials: { email?: unknown; password?: unknown };
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados de login inválidos." }, { status: 400 });
  }

  const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
  const password = typeof credentials.password === "string" ? credentials.password : "";
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !passwordHash) {
    return NextResponse.json({ error: "Autenticação não configurada no servidor." }, { status: 503 });
  }

  if (email !== adminEmail || !(await bcrypt.compare(password, passwordHash))) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  try {
    await ensureDatabaseSchema();
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        id: createId("user"),
        email: adminEmail,
        passwordHash,
        createdAt: new Date(),
      },
      update: { passwordHash },
    });

    await prisma.simulation.updateMany({
      where: { ownerId: null },
      data: { ownerId: user.id },
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user.id), sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Falha ao autenticar usuário.", error);
    return NextResponse.json({ error: "Não foi possível iniciar a sessão." }, { status: 500 });
  }
}
