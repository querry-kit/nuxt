// src/utils/serialize-query.ts
import qs from "qs";
function serializeQuery(query = {}) {
  return qs.stringify(query, { addQueryPrefix: true, encodeValuesOnly: true });
}

export {
  serializeQuery
};
//# sourceMappingURL=chunk-3Q5MFWY7.js.map