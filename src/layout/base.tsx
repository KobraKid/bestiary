import * as React from 'react';
import { ILayoutElement, LAYOUT_TYPE } from '../interfaces/ILayout';
import { Horizontal, IHorizontalProps, Vertical, IVerticalProps } from './groupings';
import { String, IStringProps, Ratio, IRatioProps, Percent, IPercentProps } from './basic';
import { Sprite, ISpriteProps, SpriteList, ISpriteListProps } from './images';
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
  const { data, layout, onLinkClicked } = props;

  switch (layout.type) {
    /* Groupings */
    case LAYOUT_TYPE.horizontal:
      const horizontalL = (layout as IHorizontalProps);
      return <Horizontal data={data} style={horizontalL.style} elements={horizontalL.elements} onLinkClicked={onLinkClicked} />;
    case LAYOUT_TYPE.vertical:
      const verticalL = (layout as IVerticalProps);
      return <Vertical data={data} style={verticalL.style} elements={verticalL.elements} onLinkClicked={onLinkClicked} />;
    /* Basic */
    case LAYOUT_TYPE.string:
      const stringL = (layout as IStringProps);
      return <String data={data} style={stringL.style} value={stringL.value} />;
    case LAYOUT_TYPE.ratio:
      const ratioL = (layout as IRatioProps);
      return <Ratio data={data} style={ratioL.style} a={ratioL.a} b={ratioL.b} />;
    case LAYOUT_TYPE.percent:
      const percentL = (layout as IPercentProps);
      return <Percent data={data} style={percentL.style} label={percentL.label} value={percentL.value} />;
    /* Images */
    case LAYOUT_TYPE.sprite:
      const spriteL = (layout as ISpriteProps);
      return <Sprite data={data} style={spriteL.style} value={spriteL.value} />;
    case LAYOUT_TYPE.spritelist:
      const spritelistL = (layout as ISpriteListProps);
      return <SpriteList data={data} style={spritelistL.style} values={spritelistL.values} />;
    /* Relations */
    case LAYOUT_TYPE.link:
      const linkL = (layout as ILinkProps);
      return <Link data={data} style={linkL.style} link={linkL.link} onLinkClicked={onLinkClicked} />
    case LAYOUT_TYPE.chain:
      const chainL = (layout as IChainProps);
      return <Chain data={data} style={chainL.style} previous={chainL.previous} next={chainL.next} onLinkClicked={onLinkClicked} />
    /* Maps */
    case LAYOUT_TYPE.map:
      const mapL = (layout as IMapProps);
      return <Map data={data} style={mapL.style} value={mapL.value} poi={mapL.poi} onLocationClicked={onLinkClicked} />
    default:
      return null;
  }
}

/**
 * Retrieve the value of an attribute or a literal value for display in a layout component.
 * @param data The list of attributes available for the current entry
 * @param value The attribute to search for.
 * @returns The value of an attribute. If `value` starts with '!', the value will be looked up from the entry's attributes.
 *          Otherwise, the literal value will be returned.
 */
export function getValueOrLiteral<T>(data: object, value?: string | T): T {
  try {
    if (typeof value === 'string') {
      return value?.startsWith('!') ? data[value.substring(1) as keyof typeof data] as T : value as unknown as T;
    }
  } catch (e: unknown) {
    if (typeof e === 'string') {
      console.log(e);
    }
    else if (e instanceof Error) {
      console.log(e.name, e.message, e.stack);
    }
    return e as T;
  }
  return value as T;
}

export function getStyle(data: object, style: React.CSSProperties | undefined): React.CSSProperties {
  const translatedStyle: React.CSSProperties = {};
  for (const props in style) {
    const value = style[props as keyof React.CSSProperties];
    // @ts-expect-error: Expression produces a union type that is too complex to represent
    translatedStyle[props as keyof React.CSSProperties] = getValueOrLiteral<string | number | (string & {}) | (number & {}) | undefined>(data, value);
  }
  return translatedStyle;
}