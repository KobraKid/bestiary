import React from 'react';
import { ILayoutElement } from '../interfaces/ILayout';

export interface ISpriteProps extends ILayoutElement {
  value: string,
  width: number,
  height: number,
}

export const Sprite = (props: ISpriteProps) => {
  const { type: _, pkg, data, value, width, height } = props;

  return (
    (value in data) ?
      <img src={pkg?.metadata.path + "\\" + data[value as keyof typeof data]} width={width} height={height} />
      : null
  );
}
