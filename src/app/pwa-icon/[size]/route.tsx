import { ImageResponse } from "next/og";

const tamanhos = [192, 512];

export function generateStaticParams() {
  return tamanhos.map((size) => ({ size: String(size) }));
}

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!tamanhos.includes(size)) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <svg width={size} height={size} viewBox="0 0 256 256">
        <rect width="256" height="256" fill="#FF6B3D" />
        <path
          fill="#FFFFFF"
          d="M41 196 V89 Q41 82 47 77 L83 50 Q89 45 96 50 L166 98 V141 L93 91 L69 109 V166 Z"
        />
        <path
          fill="#FFFFFF"
          d="M89 117 L89 148 L158 195 Q166 201 174 195 L210 168 Q215 164 215 156 V53 L188 73 V150 L164 168 Z"
        />
      </svg>
    ),
    { width: size, height: size },
  );
}
