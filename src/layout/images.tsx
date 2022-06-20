import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';
import { getValueOrLiteral } from './base';

export interface ISpriteProps extends ILayoutElement {
  value: string,
  width: string,
  height: string,
}

export const Sprite = (props: ISpriteProps) => {
  const { type: _, pkg, data } = props;

  let value = getValueOrLiteral<string>(data, props.value);
  let width = getValueOrLiteral<string>(data, props.width);
  let height = getValueOrLiteral<string>(data, props.height);

  return (
    <img src={window.path.join(pkg!.metadata.path, value)} width={width} height={height} />
  );
}
