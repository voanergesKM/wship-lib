"use client";

import { useAuth } from "./components/AuthContext";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">Каталог ресурсів</h1>
      <p className="text-gray-400 mb-8">
        Ця сторінка доступна всім користувачам без авторизації.
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-500">Завантаження профілю...</p>
      ) : isAuthenticated && user ? (
        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
          <p>
            Ви увійшли як:{" "}
            <span className="font-bold text-green-400">{user.firstName}</span>
          </p>
        </div>
      ) : (
        <div className="p-4 bg-yellow-950/20 border border-yellow-500/30 rounded-xl text-center space-y-3">
          <p className="text-yellow-400">Ви переглядаєте сайт як гість.</p>
          {/* Коли додасте Google Auth, тут буде просто кнопка "Увійти через Google" */}
          <button className="px-4 py-2 bg-white text-black font-medium rounded-lg text-sm">
            Увійти через Google (Скоро)
          </button>
        </div>
      )}
    </>
  );
}
