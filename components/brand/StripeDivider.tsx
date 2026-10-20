/** Faixa de listras dourado, laranja e vermelho da identidade G'26. */
export function StripeDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`stripe-divider ${className}`} aria-hidden="true">
      <span className="w-[72%] bg-nave-gold" />
      <span className="w-[86%] bg-nave-orange" />
      <span className="w-full bg-nave-red" />
    </div>
  );
}
