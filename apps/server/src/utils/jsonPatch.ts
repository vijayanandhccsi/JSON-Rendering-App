export interface PatchOperation {
  op: "add" | "replace" | "remove";
  path: string;
  value?: any;
}

function decodePointerToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function parsePointer(path: string): string[] {
  if (!path || path === "") return [];
  if (!path.startsWith("/")) {
    throw new Error(`Invalid JSON Pointer "${path}": must start with '/'`);
  }
  return path.slice(1).split("/").map(decodePointerToken);
}

export function isPatchPayload(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;

  // Case 1: Array of operations [{ op: "replace", path: ... }, ...]
  if (Array.isArray(json)) {
    return json.length > 0 && json.every((item) => isPatchOp(item));
  }

  // Case 2: Wrapper object { patch: [...] } or { operations: [...] }
  if ("patch" in json && Array.isArray((json as any).patch)) {
    return (json as any).patch.length > 0 && (json as any).patch.every((item: any) => isPatchOp(item));
  }
  if ("operations" in json && Array.isArray((json as any).operations)) {
    return (json as any).operations.length > 0 && (json as any).operations.every((item: any) => isPatchOp(item));
  }

  return false;
}

export function extractPatchOperations(json: unknown): PatchOperation[] {
  if (Array.isArray(json)) return json as PatchOperation[];
  if (json && typeof json === "object") {
    if ("patch" in json && Array.isArray((json as any).patch)) {
      return (json as any).patch as PatchOperation[];
    }
    if ("operations" in json && Array.isArray((json as any).operations)) {
      return (json as any).operations as PatchOperation[];
    }
  }
  throw new Error("Invalid patch payload structure");
}

function isPatchOp(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.op === "string" &&
    ["add", "replace", "remove"].includes(obj.op as string) &&
    typeof obj.path === "string"
  );
}

export function applyJsonPatch<T = unknown>(targetDoc: T, ops: PatchOperation[]): T {
  let doc = JSON.parse(JSON.stringify(targetDoc));

  for (let i = 0; i < ops.length; i++) {
    const operation = ops[i];
    if (!operation) continue;
    const { op, path, value } = operation;
    const tokens = parsePointer(path);

    if (tokens.length === 0) {
      if (op === "replace" || op === "add") {
        doc = value;
        continue;
      } else {
        throw new Error(`Cannot remove root document (op #${i})`);
      }
    }

    const parentTokens = tokens.slice(0, -1);
    const lastToken = tokens[tokens.length - 1];
    if (lastToken === undefined) {
      throw new Error(`Invalid empty path (op #${i})`);
    }

    let parent: any = doc;
    for (let j = 0; j < parentTokens.length; j++) {
      const token = parentTokens[j];
      if (token === undefined) continue;
      if (parent === null || typeof parent !== "object") {
        throw new Error(`Invalid path "${path}" at segment "${token}" (op #${i})`);
      }
      if (Array.isArray(parent)) {
        const index = parseInt(token, 10);
        if (isNaN(index) || index < 0 || index >= parent.length) {
          throw new Error(`Array index out of bounds "${token}" in path "${path}" (op #${i})`);
        }
        parent = parent[index];
      } else {
        if (!(token in parent)) {
          throw new Error(`Property "${token}" does not exist in path "${path}" (op #${i})`);
        }
        parent = parent[token];
      }
    }

    if (parent === null || typeof parent !== "object") {
      throw new Error(`Target container at path "${path}" is not an object or array (op #${i})`);
    }

    if (Array.isArray(parent)) {
      if (op === "add") {
        if (lastToken === "-") {
          parent.push(JSON.parse(JSON.stringify(value)));
        } else {
          const index = parseInt(lastToken, 10);
          if (isNaN(index) || index < 0 || index > parent.length) {
            throw new Error(`Invalid array index "${lastToken}" in path "${path}" for add (op #${i})`);
          }
          parent.splice(index, 0, JSON.parse(JSON.stringify(value)));
        }
      } else if (op === "replace") {
        const index = parseInt(lastToken, 10);
        if (isNaN(index) || index < 0 || index >= parent.length) {
          throw new Error(`Invalid array index "${lastToken}" in path "${path}" for replace (op #${i})`);
        }
        parent[index] = JSON.parse(JSON.stringify(value));
      } else if (op === "remove") {
        const index = parseInt(lastToken, 10);
        if (isNaN(index) || index < 0 || index >= parent.length) {
          throw new Error(`Invalid array index "${lastToken}" in path "${path}" for remove (op #${i})`);
        }
        parent.splice(index, 1);
      }
    } else {
      if (op === "add" || op === "replace") {
        parent[lastToken] = JSON.parse(JSON.stringify(value));
      } else if (op === "remove") {
        if (!(lastToken in parent)) {
          throw new Error(`Cannot remove non-existent property "${lastToken}" in path "${path}" (op #${i})`);
        }
        delete parent[lastToken];
      }
    }
  }

  return doc;
}
