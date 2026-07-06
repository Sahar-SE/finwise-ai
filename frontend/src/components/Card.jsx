export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className}`}>
      {children}
    </div>
  );
}
