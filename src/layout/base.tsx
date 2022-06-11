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
      return <Horizontal pkg={pkg} data={data} elements={(layout as IHorizontalProps).elements} />;
    case LAYOUT_TYPE.vertical:
      return <Vertical pkg={pkg} data={data} elements={(layout as IVerticalProps).elements} />;
    /* Basic */
    case LAYOUT_TYPE.string:
      return <String data={data} value={(layout as IStringProps).value} />;
    case LAYOUT_TYPE.ratio:
      return <Ratio data={data} a={(layout as IRatioProps).a} b={(layout as IRatioProps).b} />;
    case LAYOUT_TYPE.percent:
      return <Percent data={data} value={(layout as IPercentProps).value} />;
    /* Images */
    case LAYOUT_TYPE.sprite:
      return <Sprite pkg={pkg} data={data} value={(layout as ISpriteProps).value} width={(layout as ISpriteProps).width} height={(layout as ISpriteProps).height} />;
    /* Relations */
    case LAYOUT_TYPE.link:
      return <Link pkg={pkg} data={data} link={(layout as ILinkProps).link} />
    default:
      return null;
  }
}
