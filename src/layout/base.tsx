import * as React from 'react';
import { IDataProps, ILayoutElement, LAYOUT_TYPE } from '../model/Layout';
import { Horizontal, IHorizontalProps, Vertical, IVerticalProps, IListProps, List } from './groupings';
import { String, IStringProps, Ratio, IRatioProps, Percent, IPercentProps, Number, INumberProps } from './basic';
import { Sprite, ISpriteProps, SpriteList, ISpriteListProps } from './images';
import { Chain, IChainProps, ILinkProps, Link } from './relation';
import { Map, IMapProps } from './map';
import { Grid, IGridProps } from './grid';

export const Base = (props: ILayoutElement) => {
  switch (props.layout.type) {
    /* Groupings */
    case LAYOUT_TYPE.horizontal:
      return <Horizontal {...(props as IHorizontalProps)} />;
    case LAYOUT_TYPE.vertical:
      return <Vertical {...(props as IVerticalProps)} />;
    case LAYOUT_TYPE.list:
      return <List {...(props as IListProps)} />;
    /* Basic */
    case LAYOUT_TYPE.string:
      return <String {...(props as IStringProps)} />;
    case LAYOUT_TYPE.number:
      return <Number {...(props as INumberProps)} />;
    case LAYOUT_TYPE.ratio:
      return <Ratio {...(props as IRatioProps)} />;
    case LAYOUT_TYPE.percent:
      return <Percent {...(props as IPercentProps)} />;
    /* Images */
    case LAYOUT_TYPE.sprite:
      return <Sprite {...(props as ISpriteProps)} />;
    case LAYOUT_TYPE.spritelist:
      return <SpriteList {...(props as ISpriteListProps)} />;
    /* Relations */
    case LAYOUT_TYPE.link:
      return <Link {...(props as ILinkProps)} />
    case LAYOUT_TYPE.chain:
      return <Chain {...(props as IChainProps)} />
    /* Maps */
    case LAYOUT_TYPE.map:
      return <Map {...(props as IMapProps)} />
    /* Grids */
    case LAYOUT_TYPE.grid:
      return <Grid {...(props as IGridProps)} />
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
export function getValueOrLiteral<T>(data: IDataProps, value?: string | T): T {
  let val: T = value as unknown as T;

  const defs = data.pkg.metadata.defs;

  try {
    if (typeof value === 'string' && value?.startsWith('!')) {
      val = data.entry.attributes[value.substring(1) as keyof typeof data.entry.attributes];
    }
  } catch (e: unknown) {
    if (typeof e === 'string') { console.log(e); }
    else if (e instanceof Error) { console.log(e.name, e.message, e.stack); }
    return e as T;
  }

  if (typeof val === 'string' && val?.startsWith('@')) {
    val = defs[val.substring(1) as keyof typeof defs];
  }

  if (typeof val === 'string' && val?.startsWith('~')) {
    let link = val.split('|');
    val = [(link[0] ?? '~').substring(1), link[1] ?? ''] as unknown as T;
  }

  return val;
}

export function getStyle(data: IDataProps, style: React.CSSProperties | undefined): React.CSSProperties {
  const translatedStyle: React.CSSProperties = {};
  for (const props in style) {
    const value = style[props as keyof React.CSSProperties];
    // @ts-expect-error: Expression produces a union type that is too complex to represent
    translatedStyle[props as keyof React.CSSProperties] = getValueOrLiteral<string | number | (string & {}) | (number & {}) | undefined>(data, value);
  }
  return translatedStyle;
}