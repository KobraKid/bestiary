import React from 'react';
import IPackage, { ICollection, IEntry } from './IPackage';

export const enum LAYOUT_TYPE {
  /* groupings */
  horizontal = 'horizontal',
  vertical = 'vertical',
  list = 'list',
  /* basic */
  string = 'string',
  number = 'number',
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

export interface ILayoutProps {
  /**
   * The layout type to render
   */
  type?: LAYOUT_TYPE,
  /**
   * Custom style attributes
   */
  style?: React.CSSProperties,
}

export interface IDataProps  {
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

export interface ILinkableProps {
  onLinkClicked?: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void
}

export interface ILayoutElement extends ILinkableProps {
  layout: ILayoutProps,
  /**
   * Data required to parse layout parameters
   */
  data: IDataProps,
}
