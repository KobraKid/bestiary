import * as React from 'react';
import { IDataProps, ILayoutElement, LAYOUT_TYPE } from '../model/Layout';
import { Horizontal, IHorizontalProps, Vertical, IVerticalProps } from './groupings';
import { String, IStringProps, Ratio, IRatioProps, Percent, IPercentProps, Number, INumberProps } from './basic';
import { Sprite, ISpriteProps, SpriteList, ISpriteListProps } from './images';
import { ILinkProps, Link } from './relation';
import { Map, IMapProps } from './map';
import { Grid, IGridProps } from './grid';
import { AttributeValue } from '../model/Attribute';

export const Base = (props: ILayoutElement) => {
  switch (props.layout.type) {
    /* Groupings */
    case LAYOUT_TYPE.horizontal:
      return <Horizontal {...(props as IHorizontalProps)} />;
    case LAYOUT_TYPE.vertical:
      return <Vertical {...(props as IVerticalProps)} />;
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
export function getValueOrLiteral(data: IDataProps, value?: string | AttributeValue | undefined): AttributeValue {
  let val: AttributeValue = value ?? '';

  const defs = data.pkg.metadata.defs;

  try {
    if (typeof val === 'string' && val?.startsWith('!')) {
      val = data.entry.attributes[val.substring(1) as keyof typeof data.entry.attributes] ?? '';
    }
  } catch (e: unknown) {
    if (typeof e === 'string') { console.log(e); }
    else if (e instanceof Error) { console.log(e.name, e.message, e.stack); }
    return "" + e;
  }

  if (typeof val === 'string' && val.startsWith('@')) {
    val = defs[val.substring(1) as keyof typeof defs];
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