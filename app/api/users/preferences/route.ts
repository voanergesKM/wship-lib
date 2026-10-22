import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { getServerAuth } from "@/lib/serverAuth";
import { UserPreference } from "@/models/UserPreference";
import {
  DEFAULT_SONG_DISPLAY_PREFERENCES,
  type SongDisplayPreferences,
  type UserPreferences,
} from "@/types/user-preferences";

const songDisplayPreferencesSchema = z
  .object({
    fontSize: z.number().int().min(10).max(24).optional(),
    showChords: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Передайте щонайменше одне налаштування",
  });

function serializePreferences(preference: {
  songDisplay?: Partial<SongDisplayPreferences> | null;
} | null): UserPreferences {
  return {
    version: 1,
    songDisplay: {
      ...DEFAULT_SONG_DISPLAY_PREFERENCES,
      ...preference?.songDisplay,
    },
  };
}

export async function PATCH(request: NextRequest) {
  const session = await getServerAuth();
  if (!session.authenticated || !session.user) {
    return NextResponse.json({ message: "Неавторизовано" }, { status: 401 });
  }

  try {
    const payload = songDisplayPreferencesSchema.parse(await request.json());
    await connectDB();

    const preference = await UserPreference.findOneAndUpdate(
      { userId: session.user.id },
      {
        $set: Object.fromEntries(
          Object.entries(payload).map(([key, value]) => [
            `songDisplay.${key}`,
            value,
          ]),
        ),
        $setOnInsert: { version: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ preferences: serializePreferences(preference) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Некоректні налаштування", errors: error.issues },
        { status: 400 },
      );
    }

    console.error("Unable to update user preferences:", error);
    return NextResponse.json(
      { message: "Не вдалося зберегти налаштування" },
      { status: 500 },
    );
  }
}
