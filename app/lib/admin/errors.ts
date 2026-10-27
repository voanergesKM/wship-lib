import { NextResponse } from "next/server";
import { ZodError } from "zod";
export class AdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues.map((i) => i.message).join(". ") },
      { status: 400 },
    );
  if (error instanceof SyntaxError)
    return NextResponse.json({ error: "Некоректний JSON" }, { status: 400 });
  console.error("Admin operation failed", error);
  return NextResponse.json(
    { error: "Не вдалося виконати дію" },
    { status: 500 },
  );
}
