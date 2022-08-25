import { AttributeData } from "./Attribute";

/**
 * Represents an entry in a collection
 */
export default interface IEntry {
  /**
   * Entry name
   */
  id: string,
  /**
   * Entry attributes
   */
  attributes: AttributeData,
}

export function buildEntry(id: string): IEntry {
  return {
    id: id,
    attributes: {}
  };
}

export function copyEntry(entry: IEntry): IEntry {
  let copiedEntry: IEntry = {
    id: entry.id,
    attributes: { ...entry.attributes }
  };
  return copiedEntry;
}