import React from 'react';

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
  /* formula */
  formula = 'formula'
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