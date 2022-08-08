import * as React from 'react';
import { ILayoutElement, LAYOUT_TYPE } from '../interfaces/ILayout';
import { Horizontal, IHorizontalProps, Vertical, IVerticalProps } from './groupings';
import { String, IStringProps, Ratio, IRatioProps, Percent, IPercentProps } from './basic';
import { Sprite, ISpriteProps } from './images';
import { Chain, IChainProps, ILinkProps, Link } from './relation';
import { Map, IMapProps } from './map';
import IPackage, { ICollection, IEntry } from '../interfaces/IPackage';

interface IBaseProps {
  data: {
    pkg: IPackage,
    collection: ICollection,
    entry: IEntry,
  }
  layout: ILayoutElement,
  onLinkClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

export const Base = (props: IBaseProps) => {
  const { data,layout, onLinkClicked } = props;

  switch (layout.type) {
    /* Groupings */
    case LAYOUT_TYPE.horizontal:
      const horizontalL = (layout as IHorizontalProps);
      return <Horizontal data={data} elements={horizontalL.elements} onLinkClicked={onLinkClicked} />;
    case LAYOUT_TYPE.vertical:
      const verticalL = (layout as IVerticalProps);
      return <Vertical data={data} elements={verticalL.elements} onLinkClicked={onLinkClicked} />;
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
      return <Sprite data={data} value={spriteL.value} width={spriteL.width} height={spriteL.height} />;
    /* Relations */
    case LAYOUT_TYPE.link:
      const linkL = (layout as ILinkProps);
      return <Link data={data} link={linkL.link} onLinkClicked={onLinkClicked} />
    case LAYOUT_TYPE.chain:
      const chainL = (layout as IChainProps);
      return <Chain data={data} previous={chainL.previous} next={chainL.next} onLinkClicked={onLinkClicked} />
    /* Maps */
    case LAYOUT_TYPE.map: 
      const mapL = (layout as IMapProps);
      return <Map data={data} value={mapL.value} poi={mapL.poi} onLocationClicked={onLinkClicked} />
    default:
      return null;
  }
}

/**
 * Retrieve the value of an attribute or a literal value for display in a layout component.
 * @param data The list of attributes available for the current entry
 * @param value The attribute to search for.
 * @returns The value of an attribute. If `value` starts with '!', the literal value following '!' will be returned instead.
 */
export function getValueOrLiteral<T>(data: object, value?: string | T): T {
  if (typeof value === 'string') {
    return value?.startsWith('!') ? value.substring(1) as any as T : data[value as keyof typeof data] as T;
  }
  return value as T;
}