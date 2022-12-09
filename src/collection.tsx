import React, { useContext, useEffect, useState } from 'react';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { Entry } from './entry';
import { IDataProps } from './model/Layout';
import './styles/transitions.scss';
import { getValueOrLiteral } from './layout/base';
import { ICollectionConfig } from './model/Config';
import CollectionContext from './context';

/**
 * Props for the Collection
 */
interface ICollectionProps {
  /** The current Package and Collection */
  data: Omit<IDataProps, "entry">,
  /** The current collection's collection config */
  collectionConfig?: ICollectionConfig[] | null,
  /** Whether the package menu is expanded */
  pkgMenuExpanded: boolean,
  /** Callback function for when an entry is clicked */
  onEntryClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
  onEntryCollected: (entryId: string, collectionConfigId: number) => void
}

/**
 * Renders a collection of entries.
 * 
 * @param props The props
 * @returns A collection
 */
export const Collection = (props: ICollectionProps) => {
  const { data, collectionConfig, pkgMenuExpanded, onEntryClicked, onEntryCollected } = props;

  const collection = useContext(CollectionContext);

  const [subsections, setSubsections] = useState<Array<string>>([]);

  useEffect(() => {
    setSubsections(() => {
      let subsections = new Set<string>();
      collection.data.forEach(entry =>
        subsections.add(getValueOrLiteral({ entry, ...data }, entry.category ?? "").toString()));
      return Array.from(subsections);
    });
  }, [data]);

  return (
    <div className={`collection-grid-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      {subsections?.map((subsection) =>
        <Subsection
          key={subsection}
          title={subsection}
          data={data}
          collectionConfig={collectionConfig?.filter(c => c.categories.length < 1 || c.categories.includes(subsection)) ?? null}
          entries={collection.data.filter((entry) => getValueOrLiteral({ entry, ...data }, entry.category ?? "") === subsection)}
          onEntryClicked={onEntryClicked}
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
  /** The current Package and Collection */
  data: Omit<IDataProps, "entry">,
  /** The current collection's config */
  collectionConfig: ICollectionConfig[] | null,
  /** The subsection's entries */
  entries: IEntry[],
  /** Callback function for when an entry is clicked */
  onEntryClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
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
  const { title, data, collectionConfig, entries, onEntryClicked, onEntryCollected } = props;
  
  const collection = useContext(CollectionContext);

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
        <Entry
          key={entry.id}
          data={{ entry: entry, ...data }}
          collectionConfig={collectionConfig}
          isPreview
          className='preview-item'
          onLinkClicked={onEntryClicked}
          onClick={() => onEntryClicked(entry, collection, null, collection)}
          onCollect={(collectionConfigId) => onEntryCollected(entry.id, collectionConfigId)} />
      )}
    </div>
  );
}