import * as React from 'react';
import { ILayoutElement, LAYOUT_TYPE } from '../interfaces/ILayout';
import { Horizontal, IHorizontalProps, Vertical, IVerticalProps } from './groupings';
import { String, IStringProps, Ratio, IRatioProps, Percent, IPercentProps } from './basic';
import { Sprite, ISpriteProps } from './images';

interface IBaseProps {
  data?: any,
  path?: string,
  layout: ILayoutElement | null | undefined,
}

export const Base = (props: IBaseProps) => {
  const { data, path, layout } = props;

  if (!layout?.type) {
    return null;
  }

  switch (layout.type) {
    case LAYOUT_TYPE.horizontal:
      return <Horizontal type={layout.type} path={path} data={data} elements={(layout as IHorizontalProps).elements} />;
    case LAYOUT_TYPE.vertical:
      return <Vertical type={layout.type} path={path} data={data} elements={(layout as IVerticalProps).elements} />;
    case LAYOUT_TYPE.string:
      return <String data={data} value={(layout as IStringProps).value} />;
    case LAYOUT_TYPE.ratio:
      return <Ratio data={data} a={(layout as IRatioProps).a} b={(layout as IRatioProps).b} />;
    case LAYOUT_TYPE.percent:
      return <Percent data={data} value={(layout as IPercentProps).value} />;
    case LAYOUT_TYPE.sprite:
      return <Sprite path={path} data={data} value={(layout as ISpriteProps).value} width={(layout as ISpriteProps).width} height={(layout as ISpriteProps).height} />;
    default:
      return null;
  }
}
