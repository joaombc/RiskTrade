/** Preenche um modelo de frase: fmt("Venda em {date}", { date: "05/10" }) → "Venda em 05/10". */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
