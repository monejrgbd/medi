const SECTION_HEADERS = [
  "SUBJECTIVE",
  "OBJECTIVE",
  "ASSESSMENT",
  "PLAN",
  "HISTORY OF PRESENT ILLNESS",
  "REVIEW OF SYSTEMS",
  "PHYSICAL EXAMINATION",
  "MEDICATIONS",
  "ALLERGIES",
  "CHIEF COMPLAINT",
  "IMPRESSION",
  "RECOMMENDATIONS",
  "FOLLOW UP",
  "DISPOSITION",
];

function stripMarkdown(text: string): string {
  let result = text;
  // Remove bold/italic markers
  result = result.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");
  result = result.replace(/_{1,3}([^_]+)_{1,3}/g, "$1");
  // Remove headings (# ## ###)
  result = result.replace(/^#{1,6}\s+/gm, "");
  // Remove bullet markers
  result = result.replace(/^[\s]*[-*+]\s+/gm, "");
  // Remove numbered list markers
  result = result.replace(/^[\s]*\d+\.\s+/gm, "");
  // Remove inline code backticks
  result = result.replace(/`([^`]+)`/g, "$1");
  // Remove link syntax [text](url)
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Remove horizontal rules
  result = result.replace(/^[-*_]{3,}$/gm, "");
  return result;
}

function normalizeWhitespace(text: string): string {
  // Collapse multiple blank lines into one
  let result = text.replace(/\n{3,}/g, "\n\n");
  // Trim trailing whitespace on each line
  result = result
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
  return result.trim();
}

function isSectionHeader(line: string): boolean {
  const trimmed = line.trim().replace(/:$/, "").toUpperCase();
  return SECTION_HEADERS.includes(trimmed);
}

export function formatForEmrPaste(
  contentBody: string,
  format: "plain" | "structured" = "plain"
): string {
  if (!contentBody) return "";

  if (format === "plain") {
    const stripped = stripMarkdown(contentBody);
    return normalizeWhitespace(stripped);
  }

  // Structured: preserve section headers with blank lines between
  const stripped = stripMarkdown(contentBody);
  const lines = stripped.split("\n");
  const output: string[] = [];
  let lastWasHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      // Skip consecutive blank lines, but keep one
      if (output.length > 0 && output[output.length - 1] !== "") {
        output.push("");
      }
      continue;
    }

    if (isSectionHeader(trimmed)) {
      // Add blank line before section headers (unless at start)
      if (output.length > 0 && output[output.length - 1] !== "") {
        output.push("");
      }
      // Uppercase the header and add colon if missing
      const header = trimmed.replace(/:$/, "").toUpperCase();
      output.push(header + ":");
      lastWasHeader = true;
    } else {
      lastWasHeader = false;
      output.push(trimmed);
    }
  }

  return normalizeWhitespace(output.join("\n"));
}
