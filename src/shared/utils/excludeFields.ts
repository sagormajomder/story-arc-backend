export const excludeFields = <T, Key extends keyof T>(
  obj: T,
  keys: readonly Key[],
): Omit<T, Key> => {
  const newObj = { ...obj };
  keys.forEach((key) => {
    delete newObj[key];
  });
  return newObj;
};
