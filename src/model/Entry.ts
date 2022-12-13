import { AttributeData } from "./Attribute";

/**
 * Represents an entry in a collection
 */
export default interface IEntry {
  /**
   * Entry ID
   */
  id: string,
  /**
   * Entry category
   */
  category?: string,
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
    category: entry.category,
    attributes: { ...entry.attributes }
  };
  return copiedEntry;
}