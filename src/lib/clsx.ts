export function clsx(
  ...parts: Array<string | number | false | null | undefined>
): string {
  return parts.filter(Boolean).join(' ');
}
