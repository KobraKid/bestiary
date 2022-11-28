import React from 'react';
import IPackage from './Package';
import ICollection from './Collection';
import IEntry from './Entry';
import { ICollectionConfig } from './Config';

export enum LAYOUT_TYPE {
  /* groupings */
  horizontal = 'horizontal',
  vertical = 'vertical',
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
  /* maps */
  map = 'map',
  /* grids */
  grid = 'grid',
  list = 'list',
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

export function copyLayoutProps<T extends ILayoutProps>(props: T): T {
  let newProps = {
    ...props,
    type: props.type,
    style: Object.assign({}, props.style),
  };
  return newProps;
}

export interface IDataProps {
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
  /**
   * The layout of the entry
   */
  layout: ILayoutProps,
  /**
   * Data required to parse layout parameters
   */
  data: IDataProps,
  /**
   * Collection configuration
   */
  config?: ICollectionConfig[]
}

export function copyLayoutElement(layoutElement: Omit<ILayoutElement, 'data'>): Omit<ILayoutElement, 'data'> {
  return {
    layout: copyLayoutProps(layoutElement.layout)
  };
}