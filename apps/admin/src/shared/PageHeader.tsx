export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-3">
      <h1 className="text-xl font-semibold text-neutral-100">{title}</h1>
      {children}
    </div>
  );
}
