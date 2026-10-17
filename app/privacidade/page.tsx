import { AppShell } from "@/components/AppShell";

export default function PrivacidadePage() {
  return (
    <AppShell title="Privacidade" active="mais">
      <article className="painel flex flex-col gap-3 p-5 text-base leading-relaxed">
        <span className="selo-exemplo self-start">texto de exemplo, sujeito à aprovação da organização</span>
        <p>Esta plataforma é usada só para organizar o serviço dos voluntários do Geração Atômika 2026.</p>
        <ul className="list-disc pl-5">
          <li>Seu CPF e RG ficam criptografados e só aparecem mascarados, na retirada de rádios.</li>
          <li>Sua restrição alimentar só é vista por você e pela equipe do QG.</li>
          <li>Os elogios são anônimos: ninguém da organização vê quem elogiou pelo app.</li>
          <li>Na busca de voluntários aparecem só nome, equipe e local previsto pela escala. Nunca telefone ou documentos.</li>
          <li>CPF, RG e assinaturas são apagados alguns dias após o evento.</li>
        </ul>
        <p className="text-sm text-nave-text-secondary">Dúvidas: procure o QG dos Voluntários.</p>
      </article>
    </AppShell>
  );
}
