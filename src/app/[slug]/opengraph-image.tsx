import { ImageResponse } from "next/og";
import { getRegistryBySlug } from "@/lib/registry";
import { formatWeddingDate } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const registry = await getRegistryBySlug(slug);

  const coupleNames = registry?.coupleNames ?? "Nuestra boda";
  const date = registry ? formatWeddingDate(registry.weddingDate) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FBF6EF",
          color: "#2E2A25",
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#B08D57",
          }}
        >
          Lista de novios
        </div>
        <div style={{ fontSize: 72, marginTop: 24 }}>{coupleNames}</div>
        <div style={{ fontSize: 28, marginTop: 16, color: "#6B6459" }}>{date}</div>
      </div>
    ),
    { ...size }
  );
}
