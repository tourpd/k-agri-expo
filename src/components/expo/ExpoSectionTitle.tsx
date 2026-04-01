interface Props {
  title: string;
  subtitle?: string;
}

export default function ExpoSectionTitle({ title, subtitle }: Props) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 text-sm text-neutral-600 md:text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}