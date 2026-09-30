/** Strip Markdown syntax for the two-line card preview (SVG spec). */
export function stripMarkdown(text: string): string {
  return (
    text
      // fenced code blocks → their content
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, ''))
      // images → alt text; links → text
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // headings, quotes, list markers
      .replace(/^[>\s]*#{1,6}\s+/gm, '')
      .replace(/^[>\s]*>\s?/gm, '')
      .replace(/^\s*([-*+]|\d+[.)])\s+/gm, '')
      // emphasis, inline code, strikethrough
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      // horizontal rules
      .replace(/^\s*([-*_]\s*){3,}$/gm, '')
      // collapse whitespace
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
