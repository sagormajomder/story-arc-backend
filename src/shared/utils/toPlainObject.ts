import { Document } from 'mongoose';

export const toPlainObject = <T = Record<string, unknown>>(doc: Document | Record<string, unknown>): T => {
  if (!doc) return doc as unknown as T;
  
  let obj: Record<string, unknown>;
  if (doc && typeof (doc as Record<string, unknown>).toObject === 'function') {
    obj = (doc as { toObject: () => Record<string, unknown> }).toObject();
  } else {
    obj = { ...doc } as Record<string, unknown>;
  }
  
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  
  if (obj.__v !== undefined) {
    delete obj.__v;
  }
  
  return obj as T;
};
