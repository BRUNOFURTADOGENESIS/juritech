import Image from "next/image";

// Marca oficial recortada de public/logo-mark.png (arte original enviada,
// não uma recriação). O arquivo completo (ícone + "JuriTech") está em
// public/logo-full.jpeg pra usos maiores (ex: tela de login, e-mail).
export function LogoMark({ size = 28 }: { size?: number }) {
  const height = size;
  const width = Math.round(size * (181 / 304));
  return (
    <Image
      src="/logo-mark.png"
      alt="JuriTech"
      width={width}
      height={height}
      style={{ height, width, objectFit: "contain" }}
      priority
    />
  );
}
