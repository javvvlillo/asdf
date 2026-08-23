"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTheRegistry } from "@/lib/registry";

function parsePrice(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Precio inválido");
  }
  return Math.round(n);
}

function parseStock(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Stock inválido");
  }
  return Math.round(n);
}

function itemDataFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: (formData.get("description") as string)?.trim() || null,
    imageUrl: (formData.get("imageUrl") as string)?.trim() || null,
    price: parsePrice(formData.get("price")),
    stock: parseStock(formData.get("stock")),
    order: Number(formData.get("order")) || 0,
  };
}

export async function createItem(formData: FormData) {
  let errorParam = "";
  try {
    const registry = await getTheRegistry();
    if (!registry) throw new Error("No existe la lista todavía");

    await prisma.item.create({
      data: { registryId: registry.id, ...itemDataFromForm(formData) },
    });
  } catch {
    errorParam = "?error=no-se-pudo-crear";
  }

  revalidatePath("/admin/items");
  redirect(`/admin/items${errorParam}`);
}

export async function updateItem(itemId: string, formData: FormData) {
  let errorParam = "";
  try {
    await prisma.item.update({
      where: { id: itemId },
      data: itemDataFromForm(formData),
    });
  } catch {
    errorParam = "?error=no-se-pudo-guardar";
  }

  revalidatePath("/admin/items");
  redirect(`/admin/items${errorParam}`);
}

export async function deleteItem(itemId: string) {
  let errorParam = "";
  try {
    await prisma.item.delete({ where: { id: itemId } });
  } catch {
    // Lo más probable: tiene contribuciones asociadas (registro financiero,
    // no se borra). No intentamos distinguir el motivo exacto - un ítem con
    // historial de pagos nunca debería desaparecer por accidente.
    errorParam = "?error=tiene-aportes";
  }

  revalidatePath("/admin/items");
  redirect(`/admin/items${errorParam}`);
}
