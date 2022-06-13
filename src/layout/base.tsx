import * as React from 'react';
import { ILayoutElement, LAYOUT_TYPE } from '../interfaces/ILayout';
import { Horizontal, IHorizontalProps, Vertical, IVerticalProps } from './groupings';
import { String, IStringProps, Ratio, IRatioProps, Percent, IPercentProps } from './basic';
import { Sprite, ISpriteProps } from './images';
import IPackage from '../interfaces/IPackage';
import { ILinkProps, Link } from './relation';

interface IBaseProps {
  pkg?: IPackage,
  data: object,
  layout: ILayoutElement,
}

export const Base = (props: IBaseProps) => {
  const { pkg, data, layout } = props;
  
  if (!pkg) {
    return null;
  }

  switch (layout.type) {
    /* Groupings */
    case LAYOUT_TYPE.horizontal:
      const horizontalL = (layout as IHorizontalProps);
      return <Horizontal pkg={pkg} data={data} elements={horizontalL.elements} />;
    case LAYOUT_TYPE.vertical:
      const verticalL = (layout as IVerticalProps);
      return <Vertical pkg={pkg} data={data} elements={verticalL.elements} />;
    /* Basic */
    case LAYOUT_TYPE.string:
      const stringL = (layout as IStringProps);
      return <String data={data} value={stringL.value} color={stringL.color} backgroundColor={stringL.backgroundColor} />;
    case LAYOUT_TYPE.ratio:
      const ratioL = (layout as IRatioProps);
      return <Ratio data={data} a={ratioL.a} b={ratioL.b} />;
    case LAYOUT_TYPE.percent:
      const percentL = (layout as IPercentProps);
      return <Percent data={data} value={percentL.value} />;
    /* Images */
    case LAYOUT_TYPE.sprite:
      const spriteL = (layout as ISpriteProps);
      return <Sprite pkg={pkg} data={data} value={spriteL.value} width={spriteL.width} height={spriteL.height} />;
    /* Relations */
    case LAYOUT_TYPE.link:
      const linkL = (layout as ILinkProps);
      return <Link pkg={pkg} data={data} link={linkL.link} />
    default:
      return null;
  }
}

export function getValueOrLiteral(data: object, value?: string): string {
  return value?.startsWith("!") ? value.substring(1) : data[value as keyof typeof data];
}