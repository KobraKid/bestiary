import { ILayoutElement } from './ILayout';

/**
 * Represents a package
 */
export default interface IPackage {
  /**
   * Package metadata
   */
  metadata: IPackageMetadata,
  /**
   * Package's list of collections
   */
  collections: ICollection[],
}

/**
 * Represents a package's metadata
 */
export interface IPackageMetadata {
  /**
   * Package name
   */
  name: string,
  /**
   * Package location
   */
  path: string,
  /**
   * Package icon
   */
  icon: string,
}

/**
 * Represents a collection
 */
export interface ICollection {
  /**
   * Collection name
   */
  name: string,
  /**
   * Layout for displaying a single entry in the collection
   */
  layout: ILayoutElement,
  /**
   * Layout for previewing a single entry in the collection
   */
  layoutPreview: ILayoutElement,
  /**
   * Collection's entries
   */
  data: IEntry[],
}

/**
 * Represents an entry in a collection
 */
export interface IEntry {
  /**
   * Entry name
   */
  id: string,
  /**
   * Entry attributes
   */
  attributes: object,
}
