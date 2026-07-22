"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/utils/index.ts
var utils_exports = {};
__export(utils_exports, {
  andWhere: () => andWhere,
  filteringToWhere: () => filteringToWhere,
  isEqual: () => isEqual,
  mergeQuery: () => mergeQuery,
  parseJson: () => parseJson,
  pathsToFieldsQuery: () => pathsToFieldsQuery,
  serializeQuery: () => serializeQuery,
  sortingToOrderBy: () => sortingToOrderBy,
  unflatten: () => unflatten
});
module.exports = __toCommonJS(utils_exports);

// src/utils.ts
var import_qs = __toESM(require("qs"), 1);
function serializeQuery(query = {}) {
  return import_qs.default.stringify(query, { addQueryPrefix: true, encodeValuesOnly: true });
}
function pathsToFieldsQuery(paths) {
  const tree = {};
  for (const path of paths) {
    const parts = path.split(".").filter(Boolean);
    if (parts.length === 0) continue;
    let cursor = tree;
    for (const [index, key] of parts.entries()) {
      const isLeaf = index === parts.length - 1;
      if (isLeaf) {
        if (cursor[key] === void 0) cursor[key] = true;
        continue;
      }
      if (cursor[key] === void 0 || cursor[key] === true) cursor[key] = {};
      cursor = cursor[key];
    }
  }
  const stringify = (node) => Object.entries(node).map(([key, value]) => value === true ? key : `${key}{${stringify(value)}}`).join(",");
  const result = stringify(tree);
  return result || void 0;
}
function unflatten(value) {
  const result = {};
  for (const [path, item] of Object.entries(value)) {
    const parts = path.split(".").filter(Boolean);
    if (parts.length === 0) continue;
    let cursor = result;
    for (const [index, part] of parts.entries()) {
      if (index === parts.length - 1) {
        cursor[part] = item;
      } else {
        const child = cursor[part];
        if (!child || typeof child !== "object" || Array.isArray(child)) cursor[part] = {};
        cursor = cursor[part];
      }
    }
  }
  return result;
}
function sortingToOrderBy(sorting) {
  if (sorting.length === 0) return void 0;
  return sorting.map(({ id, desc }) => unflatten({ [id]: desc ? "desc" : "asc" }));
}
function filteringToWhere(filtering) {
  const conditions = filtering.filters.filter((filter) => filter.value !== void 0).map((filter) => {
    const value = filter.operator ? { [filter.operator]: filter.value } : filter.value;
    return unflatten({ [filter.field]: value });
  });
  if (conditions.length === 0) return void 0;
  return filtering.operator === "OR" ? { OR: conditions } : conditions.length === 1 ? conditions[0] : { AND: conditions };
}
function andWhere(...conditions) {
  const present = conditions.filter((condition) => Boolean(condition));
  if (present.length === 0) return void 0;
  return present.length === 1 ? present[0] : { AND: present };
}
function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
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
function mergeQuery(base, extra) {
  const result = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const existing = result[key];
    result[key] = existing && value && typeof existing === "object" && typeof value === "object" && !Array.isArray(existing) && !Array.isArray(value) ? mergeQuery(existing, value) : value;
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  andWhere,
  filteringToWhere,
  isEqual,
  mergeQuery,
  parseJson,
  pathsToFieldsQuery,
  serializeQuery,
  sortingToOrderBy,
  unflatten
});
//# sourceMappingURL=utils.cjs.map