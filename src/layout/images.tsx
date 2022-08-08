import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';
import { getValueOrLiteral } from './base';

export interface ISpriteProps extends ILayoutElement {
  value: string,
  width: string,
  height: string,
}

export const Sprite = (props: ISpriteProps) => {
  let value = getValueOrLiteral<string>(props.data.entry.attributes, props.value);
  if (!value) { return null; }

  let width = getValueOrLiteral<string>(props.data.entry.attributes, props.width);
  let height = getValueOrLiteral<string>(props.data.entry.attributes, props.height);

  return (
    <img src={window.path.join(props.data.pkg.metadata.path, value)} width={width} height={height} />
  );
}
