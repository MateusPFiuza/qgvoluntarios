import Image from "next/image";

/** Logos para fundo escuro (originais em ID | G'26, Ativo 49 e Ativo 56). */
export function LogoG26({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return <Image src="/brand/g26-escuro.webp" alt="G'26" width={800} height={235} priority={priority} className={className} />;
}

export function LogoGeracaoAtomika({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return <Image src="/brand/geracao-atomika-26-escuro.webp" alt="Geração Atômika 26" width={800} height={589} priority={priority} className={className} />;
}
