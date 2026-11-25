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
          backgroundColor: "#ECE3D5",
          color: "#34589A",
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 8,
            textTransform: "uppercase",
            backgroundColor: "#34589A",
            color: "#FFFFFF",
            padding: "8px 20px",
          }}
        >
          Lista de novios
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, marginTop: 24, textTransform: "uppercase" }}>{coupleNames}</div>
        <div style={{ fontSize: 30, marginTop: 16, textTransform: "uppercase" }}>{date}</div>
      </div>
    ),
    { ...size }
  );
}
