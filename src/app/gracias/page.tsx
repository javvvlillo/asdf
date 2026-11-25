import { prisma } from "@/lib/db";
import { formatClp } from "@/lib/format";

export const dynamic = "force-dynamic";

type GraciasState = "exito" | "fallo" | "pendiente";

/**
 * Página de retorno. Mercado Pago solo soporta una URL de retorno (le
 * agrega ?external_reference=xxx al redirigir), así que esta única página
 * decide qué mostrar leyendo - nunca escribiendo - el estado que ya haya
 * dejado el webhook. El invitado puede cerrar el navegador antes de llegar
 * aquí sin que eso afecte nada: esta pantalla es puramente informativa.
 */
export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ external_reference?: string }>;
}) {
  const { external_reference: externalReference } = await searchParams;

  const contribution = externalReference
    ? await prisma.contribution.findUnique({
        where: { externalReference },
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
      title: "¡Gracias por tu regalo!",
      body: contribution
        ? `Tu aporte de $${formatClp(contribution.amount)} para "${contribution.item.name}" quedó confirmado. Te enviamos un correo con los detalles.`
        : "Tu pago quedó confirmado.",
    },
    fallo: {
      title: "El pago no se completó",
      body: "No te preocupes, no se realizó ningún cargo. Puedes volver a la lista e intentar de nuevo, o elegir otro regalo.",
    },
    pendiente: {
      title: "Confirmando tu pago",
      body: "Esto puede tomar unos minutos. Te enviaremos un correo apenas quede confirmado - no es necesario que intentes pagar de nuevo.",
    },
  };

  const { title, body } = content[state];

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      {state === "exito" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/invitacion/pareja-bailando.png"
          alt="Sofía y Cristóbal bailando"
          width={461}
          height={308}
          className="w-64"
        />
      )}
      <h1 className="titulo mt-4 text-[clamp(2.75rem,12vw,4.5rem)]">{title}</h1>
      <div className="mt-6 bg-azul-600 px-6 py-5 text-sm leading-relaxed text-white">{body}</div>
      <a href="/" className="boton mt-8">
        Volver a la lista
      </a>
    </main>
  );
}
