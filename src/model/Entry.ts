/**
 * Represents an entry in a collection
 */
export default interface IEntry {
  /**
   * Package ID
   */
  packageId: string,
  /**
   * Collection ID
   */
  collectionId: string,
  /**
   * Entry ID
   */
  entryId: string,
  /**
   * Layout string
   */
  layout: string,
  /**
   * Style string
   */
  style?: string
}