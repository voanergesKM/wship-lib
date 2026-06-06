"use client";

import { useEffect, useState } from "react";

export default function WebAppPage() {
  const [tguser, setTguser] = useState(null);
  useEffect(() => {
    //@ts-ignore
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      console.log("Browser mode");
      return;
    }

    tg.ready();
    tg.expand();

    setTguser(tg.initDataUnsafe.user);
  }, []);

  return (
    <main>
      <h1>Worship Library</h1>
      {JSON.stringify(tguser)}
    </main>
  );
}
