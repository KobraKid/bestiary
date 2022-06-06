import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';

export interface ISpriteProps extends ILayoutElement {
  value: string,
  width: number,
  height: number,
}

export const Sprite = (props: ISpriteProps) => {
  const { type, path, data, value, width, height } = props;

  return <img src={path + "\\" + data[value]} width={width} height={height} />;
}
