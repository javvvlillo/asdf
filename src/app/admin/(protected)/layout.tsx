import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-charcoal/10 bg-white/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <nav className="flex gap-6 text-sm font-medium">
            <Link href="/admin" className="hover:text-gold">
              Resumen
            </Link>
            <Link href="/admin/items" className="hover:text-gold">
              Regalos
            </Link>
            <Link href="/admin/contributions" className="hover:text-gold">
              Aportes
            </Link>
          </nav>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-sm text-charcoal/50 hover:text-charcoal">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
