export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-2xl">Admin</h1>
      <form method="POST" action="/api/admin/login" className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Clave
          <input
            type="password"
            name="secret"
            required
            autoFocus
            className="rounded-lg border border-charcoal/20 bg-white px-3 py-2 focus:border-gold focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-600">Clave incorrecta</p>}
        <button
          type="submit"
          className="rounded-full bg-gold px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-terracotta-600"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
