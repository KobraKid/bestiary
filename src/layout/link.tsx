import React, { useContext, useMemo } from 'react';
import { ILayoutProps } from '../model/Layout';
import { Base, getValueOrLiteral } from './base';
import ICollection from '../model/Collection';
import IEntry from '../model/Entry';
import { AttributeValue } from '../model/Attribute';
import { CollectionConfigContext, CollectionContext, EntryContext, PackageContext } from '../context';
import '../styles/collection.scss';

// =============================================================================
// | Link
// =============================================================================
type Link = [collection: string, entry: string];

export interface ILinkLayoutProps extends ILayoutProps {
  link?: string,
  useLinkLayout?: boolean
}

export function parseLink(link: AttributeValue): Link {
  if (typeof link === 'string' && link.startsWith('~') && link.includes('|', 1)) {
    const splitLink = link.split('|');
    return [splitLink[0]?.substring(1) ?? '', splitLink[1] ?? ''];
  }
  return ['', ''];
}

export const Link = (props: ILinkLayoutProps) => {
  const { link } = props;

  const { pkg, selectEntry } = useContext(PackageContext);
  const { entry, layout } = useContext(EntryContext);

  const linkInfo = useMemo(() => parseLink(link ?? getValueOrLiteral(entry, pkg, (layout as ILinkLayoutProps).link)), [entry, link]);

  if (!Array.isArray(linkInfo) || linkInfo.length < 2) {
    window.log.writeError(`❗Could not parse link ${(layout as ILinkLayoutProps).link} ${linkInfo}`);
    return null;
  }

  const linkedCollection = useMemo(() => pkg.collections.find((collection: ICollection) => collection.name === linkInfo[0]), [pkg, entry, linkInfo[0]]);
  const linkedEntry = useMemo(() => linkedCollection?.data?.find((entry: IEntry) => entry.id === linkInfo[1]), [entry, linkedCollection, linkInfo[1]]);
  if (!linkedCollection || !linkedEntry) {
    window.log.writeError(`❗Could not establish link [${linkInfo.toString()}] (${link}):${!linkedCollection ? " Missing collection" : ""}${!linkedEntry ? " Missing entry" : ""}`)
    return null;
  }

  return (
    <CollectionContext.Provider value={{ collection: linkedCollection }}>
      <CollectionConfigContext.Provider value={{ collectionConfig: [] }}>
        <EntryContext.Provider value={{
          entry: linkedEntry,
          layout: ((layout as ILinkLayoutProps).useLinkLayout && linkedCollection.layoutLink) || linkedCollection.layoutPreview
        }}>
          <div className='linkItem' onClick={() => selectEntry(linkedEntry, linkedCollection)}>
            <Base />
          </div>
        </EntryContext.Provider>
      </CollectionConfigContext.Provider>
    </CollectionContext.Provider>
  );
}