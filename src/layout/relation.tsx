import React from 'react';
import { Entry } from '../entry';
import { ILayoutElement, ILayoutProps } from '../model/Layout';
import { getValueOrLiteral } from './base';
import ICollection from '../model/Collection';
import IEntry from '../model/Entry';
import { AttributeValue } from '../model/Attribute';
import '../styles/collection.scss';

// =============================================================================
// | Link
// =============================================================================
type Link = [string, string];

export interface ILinkProps extends ILayoutElement {
  layout: ILayoutProps & {
    link: string,
  }
}

export function parseLink(link: AttributeValue): Link {
  if (typeof link === 'string' && link.startsWith('~') && link.includes('|', 1)) {
    const splitLink = link.split('|');
    return [splitLink[0]?.substring(1) ?? '', splitLink[1] ?? ''];
  }
  return ['', ''];
}

export const Link = (props: ILinkProps) => {
  const { layout, data, onLinkClicked } = props;

  const linkInfo = parseLink(getValueOrLiteral(data, layout.link));

  if (!Array.isArray(linkInfo) || linkInfo.length < 2 || !onLinkClicked) { return null; }

  const linkedCollection = data.pkg.collections?.find((collection: ICollection) => collection.name === linkInfo[0]);
  const linkedEntry = linkedCollection?.data?.find((entry: IEntry) => entry.id === linkInfo[1]);

  return (
    (linkedCollection && linkedEntry) ?
        <Entry
          data={{ pkg: data.pkg, collection: linkedCollection, entry: linkedEntry }}
          isPreview
          onLinkClicked={onLinkClicked}
          onClick={() => onLinkClicked(linkedEntry, linkedCollection, data.entry, data.collection)}
          className='preview-item' />
      : null
  );
}