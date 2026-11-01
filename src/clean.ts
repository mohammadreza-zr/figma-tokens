// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tree = { [key: string]: any };

const isObject = (node: unknown): node is Tree =>
  node !== null && typeof node === "object";

export function renameRootKeys(node: unknown): void {
  if (Array.isArray(node)) return node.forEach(renameRootKeys);
  if (!isObject(node)) return;
  for (const key of Object.keys(node)) {
    if (key === "$root") {
      node.root = node.$root;
      delete node.$root;
      renameRootKeys(node.root);
    } else renameRootKeys(node[key]);
  }
}

export function renameCollections(
  data: Tree,
  collections: Record<string, string>,
): void {
  for (const [oldName, newName] of Object.entries(collections)) {
    if (data[oldName] === undefined || oldName === newName) continue;
    const moved = data[oldName];
    delete data[oldName];
    if (isObject(data[newName]) && isObject(moved)) {
      deepMerge(data[newName], moved);
    } else data[newName] = moved;
  }
}

export function rewriteRefs(
  node: unknown,
  collections: Record<string, string>,
): void {
  if (Array.isArray(node)) return node.forEach((n) => rewriteRefs(n, collections));
  if (!isObject(node)) return;
  const names = Object.keys(collections).sort((a, b) => b.length - a.length);
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (typeof v === "string" && v.startsWith("{") && v.endsWith("}")) {
      const from = names.find((name) => v.startsWith(`{${name}.`));
      const ref = from ? `{${collections[from]}.${v.slice(from.length + 2)}` : v;
      node[key] = ref.replace(/\$root\b/g, "root");
    } else rewriteRefs(v, collections);
  }
}

export function flattenColors(node: unknown): void {
  if (Array.isArray(node)) return node.forEach(flattenColors);
  if (!isObject(node)) return;
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (
      isObject(v) &&
      isObject(v.$value) &&
      Array.isArray(v.$value.components)
    ) {
      const { components, alpha = 1, hex } = v.$value as {
        components: number[];
        alpha?: number;
        hex?: string;
      };
      const [r, g, b] = components.map((c) => Math.round(c * 255));
      v.$value =
        alpha < 1
          ? `rgba(${r}, ${g}, ${b}, ${+alpha})`
          : (hex ?? `rgb(${r}, ${g}, ${b})`);
    } else flattenColors(v);
  }
}

export function stripMeta(node: unknown): void {
  if (Array.isArray(node)) return node.forEach(stripMeta);
  if (!isObject(node)) return;
  delete node.$extensions;
  for (const v of Object.values(node)) stripMeta(v);
}

export function deepMerge(target: Tree, source: Tree): Tree {
  for (const [key, value] of Object.entries(source)) {
    if (isObject(value) && !Array.isArray(value) && isObject(target[key])) {
      deepMerge(target[key], value);
    } else target[key] = value;
  }
  return target;
}

export function cleanTokens(
  files: Tree[],
  collections: Record<string, string>,
): Tree {
  const merged: Tree = {};
  for (const data of files) {
    renameRootKeys(data);
    renameCollections(data, collections);
    rewriteRefs(data, collections);
    flattenColors(data);
    stripMeta(data);
    deepMerge(merged, data);
  }
  return merged;
}
