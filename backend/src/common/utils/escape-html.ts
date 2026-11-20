const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for safe interpolation into HTML (element content or quoted attributes). */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

/** Flattens a value for use in an email header such as Subject. */
export function toHeaderText(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}
