import React, { useContext } from 'react';
import { LAYOUT_TYPE } from '../model/Layout';
import { Horizontal, Vertical } from './groupings';
import { String, Ratio, Percent, Number } from './basic';
import { Sprite, SpriteList } from './images';
import { Link } from './link';
import { Map } from './map';
import { Grid, List } from './grid';
import { AttributeValue } from '../model/Attribute';
import IEntry from '../model/Entry';
import IPackage from '../model/Package';
import { EntryContext } from '../context';
import { Formula } from './formula';
import { ICollectionConfig } from '../model/Config';

export const Base = () => {
  const { layout } = useContext(EntryContext);

  switch (layout.type) {
    /* Groupings */
    case LAYOUT_TYPE.horizontal:
      return <Horizontal />;
    case LAYOUT_TYPE.vertical:
      return <Vertical />;
    /* Basic */
    case LAYOUT_TYPE.string:
      return <String />;
    case LAYOUT_TYPE.number:
      return <Number />;
    case LAYOUT_TYPE.ratio:
      return <Ratio />;
    case LAYOUT_TYPE.percent:
      return <Percent />;
    /* Images */
    case LAYOUT_TYPE.sprite:
      return <Sprite />;
    case LAYOUT_TYPE.spritelist:
      return <SpriteList />;
    /* Relations */
    case LAYOUT_TYPE.link:
      return <Link />;
    /* Maps */
    case LAYOUT_TYPE.map:
      return <Map />;
    /* Grids */
    case LAYOUT_TYPE.grid:
      return <Grid />;
    case LAYOUT_TYPE.list:
      return <List />;
    /* Formula */
    case LAYOUT_TYPE.formula:
      return <Formula />
    default:
      return null;
  }
}

/**
 * Retrieve the value of an attribute or a literal value for display in a layout component.
 * @param entry The current entry.
 * @param pkg The current package.
 * @param value The attribute to search for.
 * @returns The value of an attribute. If `value` starts with '!', the value will be looked up from the entry's attributes.
 *          Otherwise, the literal value will be returned.
 */
export function getValueOrLiteral(entry: IEntry, pkg: IPackage, value?: string | AttributeValue | undefined): AttributeValue {
  let val: AttributeValue = value ?? '';

  try {
    if (typeof val === 'string' && val?.startsWith('!')) {
      const targetVal = val.substring(1);
      if (targetVal in entry.attributes) {
        val = entry.attributes[targetVal as keyof typeof entry.attributes] ?? '';
      }
      else {
        return ''; // no link found, ignore
      }
    }
  } catch (e: unknown) {
    if (typeof e === 'string') { console.log(e); }
    else if (e instanceof Error) { console.log(e.name, e.message, e.stack); }
    return '' + e;
  }

  if (typeof val === 'string' && val.startsWith('@')) {
    const targetVal = val.substring(1);
    if (targetVal in pkg.metadata.defs) {
      val = pkg.metadata.defs[targetVal as keyof typeof pkg.metadata.defs];
    }
    else {
      return '<error: definition ' + val + ' not found>'; // no def found, error
    }
  }

  return val;
}

/**
 * Retrieve the style for a layout component.
 * @param entry The current entry.
 * @param pkg The current package.
 * @param style The style attributes parsed from the package.
 * @returns A CSS object that can be applied to an HTML element.
 */
export function getStyle(entry: IEntry, pkg: IPackage, style: React.CSSProperties | undefined): React.CSSProperties {
  const translatedStyle: React.CSSProperties = {};
  for (const props in style) {
    const value = style[props as keyof React.CSSProperties];
    // @ts-expect-error: Expression produces a union type that is too complex to represent
    translatedStyle[props as keyof React.CSSProperties] = getValueOrLiteral<string | number | (string & {}) | (number & {}) | undefined>(entry, pkg, value);
  }
  return translatedStyle;
}

/**
 * Determine whether the element's attirbute is marked as a spoiler.
 * @param collectionConfig The current collection config.
 * @param entry The current entry.
 * @param attribute The entry's attribute.
 * @returns Whether the current attribute is marked as a spoiler and should be hidden.
 */
export function getShouldHide(collectionConfig: ICollectionConfig[], entry: IEntry, attribute: string | AttributeValue): boolean {
  return (
    collectionConfig.filter(config => config.spoilers.includes(attribute.toString())).length > 0
    && collectionConfig.filter(config => config.collectedEntryIds.includes(entry.id)).length === 0
  );
}