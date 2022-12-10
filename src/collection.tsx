import React, { useContext, useEffect, useState } from 'react';
import IEntry from './model/Entry';
import { Entry } from './entry';
import { getValueOrLiteral } from './layout/base';
import { ICollectionConfig } from './model/Config';
import { CollectionContext, EntryContext, PackageContext } from './context';
import './styles/transitions.scss';

/**
 * Props for the Collection
 */
interface ICollectionProps {
  /** The current collection's collection config */
  collectionConfig?: ICollectionConfig[] | null,
  /** Whether the package menu is expanded */
  pkgMenuExpanded: boolean,
  /** Callback function for when an entry is collected */
  onEntryCollected: (entryId: string, collectionConfigId: number) => void
}

/**
 * Renders a collection of entries.
 * 
 * @param props The props
 * @returns A collection
 */
export const Collection = (props: ICollectionProps) => {
  const { pkg } = useContext(PackageContext);
  const { collection } = useContext(CollectionContext);
  const { collectionConfig, pkgMenuExpanded, onEntryCollected } = props;

  const [subsections, setSubsections] = useState<Array<string>>([]);

  useEffect(() => {
    setSubsections(() => {
      let subsections = new Set<string>();
      collection.data.forEach(entry =>
        subsections.add(getValueOrLiteral(entry, pkg, entry.category ?? "").toString()));
      return Array.from(subsections);
    });
  }, [collection]);

  return (
    <div className={`collection-grid-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      {subsections.map((subsection) =>
        <Subsection
          key={subsection}
          title={subsection}
          collectionConfig={collectionConfig?.filter(c => c.categories.length < 1 || c.categories.includes(subsection)) ?? null}
          entries={collection.data.filter((entry) => getValueOrLiteral(entry, pkg, entry.category ?? "") === subsection)}
          onEntryCollected={onEntryCollected} />
      )}
    </div>
  );
}

/**
 * Props for the Subsection
 */
interface ISubSectionProps {
  /** The subsection's title */
  title: string,
  /** The current collection's config */
  collectionConfig: ICollectionConfig[] | null,
  /** The subsection's entries */
  entries: IEntry[],
  /** Callback function for when an entry is collected */
  onEntryCollected: (entryId: string, collectionConfigId: number) => void
}

/**
 * Renders a subsection within a collection.
 * 
 * A subsection displays a list of entries with a common category, 
 * displayed in the subsection header.
 * 
 * @param props The props
 * @returns A subsection within a collection
 */
export const Subsection = (props: ISubSectionProps) => {
  const { title, collectionConfig, entries, onEntryCollected } = props;

  const { collection } = useContext(CollectionContext);

  return (
    <div className='collection-subsection'>
      {title.length > 0 &&
        <div className='collection-subsection-header'>
          <div />
          <div>{title}</div>
          <div />
        </div>
      }
      {entries.map((entry) =>
        <EntryContext.Provider key={entry.id} value={{ entry, layout: collection.layoutPreview }}>
          <Entry
            collectionConfig={collectionConfig}
            className='preview-item'
            onCollect={(collectionConfigId) => onEntryCollected(entry.id, collectionConfigId)} />
        </EntryContext.Provider>
      )}
    </div>
  );
}