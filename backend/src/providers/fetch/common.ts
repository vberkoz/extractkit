import { HttpError } from "../../http/errors";

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export async function readResponseTextWithLimit(
  response: Response,
  maxBytes: number
): Promise<string> {
  const contentLengthHeader = response.headers.get("content-length");
  const declaredLength = contentLengthHeader ? Number(contentLengthHeader) : Number.NaN;

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(
      413,
      "FETCH_RESPONSE_TOO_LARGE",
      `Fetched URL content exceeded the ${maxBytes} byte limit.`
    );
  }

  if (!response.body) {
    const text = await response.text();

    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      throw new HttpError(
        413,
        "FETCH_RESPONSE_TOO_LARGE",
        `Fetched URL content exceeded the ${maxBytes} byte limit.`
      );
    }

    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      throw new HttpError(
        413,
        "FETCH_RESPONSE_TOO_LARGE",
        `Fetched URL content exceeded the ${maxBytes} byte limit.`
      );
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

export async function readResponseBytesWithLimit(
  response: Response,
  maxBytes: number
): Promise<ArrayBuffer> {
  const contentLengthHeader = response.headers.get("content-length");
  const declaredLength = contentLengthHeader ? Number(contentLengthHeader) : Number.NaN;

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(
      413,
      "FETCH_RESPONSE_TOO_LARGE",
      `Fetched content exceeded the ${maxBytes} byte limit.`
    );
  }

  const buffer = await response.arrayBuffer();

  if (buffer.byteLength > maxBytes) {
    throw new HttpError(
      413,
      "FETCH_RESPONSE_TOO_LARGE",
      `Fetched content exceeded the ${maxBytes} byte limit.`
    );
  }

  return buffer;
}
