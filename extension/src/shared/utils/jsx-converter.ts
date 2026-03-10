function kebabToCamelCase(input: string): string {
  return input.replace(/-([a-z])/g, (_, chr: string) => chr.toUpperCase());
}

function styleStringToJsx(style: string): string {
  const pairs = style
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [rawProp, ...valueParts] = chunk.split(":");
      const property = kebabToCamelCase(rawProp.trim());
      const value = valueParts.join(":").trim().replace(/"/g, '\\"');
      return `${property}: "${value}"`;
    });

  return `{{ ${pairs.join(", ")} }}`;
}

export function htmlToJsx(html: string): string {
  return html
    .replace(/class=/g, "className=")
    .replace(/for=/g, "htmlFor=")
    .replace(/style="([^"]*)"/g, (_, style: string) => `style=${styleStringToJsx(style)}`);
}
