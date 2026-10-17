export function DemoBanner({ demoMode }: { demoMode: boolean }) {
  if (!demoMode) return null;
  return (
    <div className="faixa-demo" role="status">
      DEMONSTRAÇÃO — DADOS FICTÍCIOS
    </div>
  );
}
