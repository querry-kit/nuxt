// src/utils/is-equal.ts
function isEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, i) => isEqual(item, right[i]));
  }
  const leftRecord = left;
  const rightRecord = right;
  const keys = Object.keys(leftRecord);
  return keys.length === Object.keys(rightRecord).length && keys.every((key) => isEqual(leftRecord[key], rightRecord[key]));
}

// src/utils/merge-query.ts
function mergeQuery(base, extra) {
  const result = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const existing = result[key];
    result[key] = existing && value && typeof existing === "object" && typeof value === "object" && !Array.isArray(existing) && !Array.isArray(value) ? mergeQuery(existing, value) : value;
  }
  return result;
}

export {
  isEqual,
  mergeQuery
};
//# sourceMappingURL=chunk-3V5RAB6T.js.map