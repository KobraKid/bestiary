import React from 'react';
import IPackage, { ICollection, IEntry } from './IPackage';

export const enum LAYOUT_TYPE {
  /* groupings */
  horizontal = 'horizontal',
  vertical = 'vertical',
  /* basic */
  string = 'string',
  ratio = 'ratio',
  percent = 'percent',
  /* images */
  sprite = 'sprite',
  spritelist = 'spritelist',
  /* relation */
  link = 'link',
  chain = 'chain',
  dropTable = 'dropTable',
  /* maps */
  map = 'map',
}

export interface ILayoutElement {
  /**
   * The layout type to render
   */
  type?: LAYOUT_TYPE,
  /**
   * Custom style attributes
   */
  style?: React.CSSProperties,
  /**
   * Data required to parse layout parameters
   */
  data: {
    /**
     * The selected package
     */
    pkg: IPackage,
    /**
     * The selected collection
     */
    collection: ICollection,
    /**
     * The selected entry
     */
    entry: IEntry,
  }
}
