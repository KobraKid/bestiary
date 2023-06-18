import { ICollectionMetadata } from "./Collection";

export enum ISO639Code {
  Chinese = 'zh',
  English = 'en',
  Japanese = 'ja',
  Korean = 'ko',
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
   * Package namespace
   */
  ns: string,
  /**
   * Package location
   */
  path: string,
  /**
   * Package icon
   */
  icon: string,
  /**
   * List of collections contained in this package
   */
  collections: ICollectionMetadata[],
  /**
   * List of supported languages, as ISO 639-1 codes
   */
  langs: ISO639Code[]
}

export function getLangDisplayName(lang: ISO639Code) {
  switch (lang) {
    case ISO639Code.Chinese:
      return "Chinese";
    case ISO639Code.English:
      return "English";
    case ISO639Code.Japanese:
      return "Japanese";
    case ISO639Code.Korean:
      return "Korean";
  }
}