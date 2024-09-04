function isObject(a: any) {
  return a !== null && typeof a === 'object';
}

function isEqualDeep(a: any, b: any, map: WeakMap<any, any> = new WeakMap()) {
  if (!isObject(a) || !isObject(b)) {
    return a === b;
  }

  if (a === b) return true;

  // 避免 ['a', 'b'] 与 { 0: 'a', 1: 'b' } 相等
  if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
    return false;
  }

  if (map.has(a) || map.has(b)) return true;
  map.set(a, b);

  const keys1 = [...Object.keys(a), ...Object.getOwnPropertySymbols(a)];
  const keys2 = [...Object.keys(b), ...Object.getOwnPropertySymbols(b)];
  if (keys1.length !== keys2.length) return false;

  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) return false;
    const res = isEqualDeep(a[keys1[i]], b[keys2[i]], map);
    if (!res) return false;
  }
  return true;
}

// todo: 考虑直接从lodash.es里引入
export function isEqual(a: any, b: any) {
  return isEqualDeep(a, b);
}
