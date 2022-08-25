import ICollection, { copyCollection } from './Collection';

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

export function copyPackage(pkg: IPackage): IPackage {
  let copiedPkg: IPackage = {
    metadata: copyMetadata(pkg.metadata),
    collections: pkg.collections.map(collection => copyCollection(collection))
  };
  return copiedPkg;
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
  /**
   * Package background color
   */
  color: string,
  /**
   * Definitions to be used package-wide
   */
  defs: object,
}

export function copyMetadata(metadata: IPackageMetadata): IPackageMetadata {
  let copiedMetadata: IPackageMetadata = {
    name: metadata.name,
    path: metadata.path,
    icon: metadata.icon,
    color: metadata.color,
    defs: Object.assign({}, metadata.defs)
  };
  return copiedMetadata;
}