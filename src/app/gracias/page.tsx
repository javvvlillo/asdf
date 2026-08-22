import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/format";

export const dynamic = "force-dynamic";

type GraciasState = "exito" | "fallo" | "pendiente";

/**
 * Página de retorno. Flow solo soporta una urlReturn (le agrega ?token=xxx
 * al redirigir), así que esta única página decide qué mostrar leyendo -
 * nunca escribiendo - el estado que ya haya dejado el webhook. El invitado
 * puede cerrar el navegador antes de llegar aquí sin que eso afecte nada:
 * esta pantalla es puramente informativa.
 */
export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const contribution = token
    ? await prisma.contribution.findFirst({
        where: { flowToken: token },
        include: { item: true },
      })
    : null;

  const state: GraciasState = !contribution
    ? "pendiente"
    : contribution.status === "APPROVED"
      ? "exito"
      : contribution.status === "REJECTED"
        ? "fallo"
        : "pendiente";

  const content: Record<GraciasState, { title: string; body: string }> = {
    exito: {
      title: "¡Gracias por tu regalo! 💛",
      body: contribution
        ? `Tu aporte de $${formatClp(contribution.amount)} para "${contribution.item.name}" quedó confirmado. Te enviamos un correo con los detalles.`
        : "Tu pago quedó confirmado.",
    },
    fallo: {
      title: "El pago no se pudo completar",
      body: "No te preocupes, no se realizó ningún cargo. Puedes volver a la lista e intentar de nuevo, o elegir otro regalo.",
    },
    pendiente: {
      title: "Estamos confirmando tu pago",
      body: "Esto puede tomar unos minutos. Te enviaremos un correo apenas quede confirmado - no es necesario que intentes pagar de nuevo.",
    },
  };

  const { title, body } = content[state];

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="mt-4 text-charcoal/70">{body}</p>
      <a
        href="/"
        className="mt-8 rounded-full border border-charcoal/20 px-6 py-3 text-sm font-medium uppercase tracking-wide transition hover:border-gold hover:text-gold"
      >
        Volver a la lista
      </a>
    </main>
  );
}
