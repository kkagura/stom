export function cloneDeep<T>(obj: T): T {
  // 先手动实现一个简单版本，后续考虑优化为lodash之类的工具方法
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const clone = (Array.isArray(obj) ? [] : {}) as unknown as T;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = cloneDeep(obj[key]);
    }
  }

  return clone;
}
