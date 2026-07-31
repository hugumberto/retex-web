// Ícone de calças (não existe no lucide-react). Segue o estilo dos ícones lucide:
// viewBox 24x24, sem preenchimento, traço com `currentColor`.
export function PantsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Silhueta das calças: cintura no topo, duas pernas com gancho no meio */}
      <path d="M6 3h12l-1.4 18H13l-1-11-1 11H7.4L6 3z" />
      {/* Cós */}
      <path d="M6 7h12" />
    </svg>
  );
}

export default PantsIcon;
