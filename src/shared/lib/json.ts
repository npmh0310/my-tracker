export function formatJsonContent(content: string) {
  return JSON.stringify(JSON.parse(content || "{}"), null, 2);
}

export function parseJsonError(content: string) {
  try {
    JSON.parse(content || "{}");
    return "";
  } catch (error) {
    return `JSON chưa hợp lệ: ${String(error)}`;
  }
}
