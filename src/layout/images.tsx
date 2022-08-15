import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';
import { getStyle, getValueOrLiteral } from './base';

export interface ISpriteProps extends ILayoutElement {
  value: string,
  style: React.CSSProperties,
}

export const Sprite = (props: ISpriteProps) => {
  let value = getValueOrLiteral<string>(props.data.entry.attributes, props.value);
  if (!value) { return null; }

  let style = getStyle(props.data.entry.attributes, props.style);

  return (
    <img src={window.path.join(props.data.pkg.metadata.path, value)} style={style} />
  );
}
