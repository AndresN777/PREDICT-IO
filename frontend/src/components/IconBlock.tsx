type Props = { tone?: "blue" | "ink" | "soft"; size?: "sm" | "md" };
export function IconBlock({ tone = "blue", size = "md" }: Props) {
  return <span aria-hidden className={`iconBlock icon-${tone} icon-${size}`} />;
}
