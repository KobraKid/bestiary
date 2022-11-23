import React, { useEffect, useState } from 'react';
import IPackage from './model/Package';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { Entry } from './entry';
import { IDataProps } from './model/Layout';
// import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './styles/transitions.scss';
import { getValueOrLiteral } from './layout/base';

/**
 * Props for the Collection
 */
interface ICollectionProps {
  data: Omit<IDataProps, "entry">
  /** Whether the package menu is expanded */
  pkgMenuExpanded: boolean,
  /** Callback function for when an entry is clicked */
  onEntryClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

/**
 * Renders a collection of entries.
 * 
 * @param props The props
 * @returns A collection
 */
export const Collection = (props: ICollectionProps) => {
  const { data, pkgMenuExpanded, onEntryClicked } = props;

  const [entries, setEntries] = useState<Array<IEntry>>([]);
  const [subsections, setSubsections] = useState<Array<string>>([]);

  useEffect(() => {
    setEntries([]);
  }, [data]);

  useEffect(() => {
    setSubsections(() => {
      let subsections = new Set<string>();
      data.collection.data.forEach(entry =>
        subsections.add(getValueOrLiteral({ entry, ...data }, entry.category ?? "").toString()));
      return Array.from(subsections);
    });
  }, [entries, setSubsections]);

  // useEffect(() => {
  //   const index = entries.length;
  //   let timer: NodeJS.Timeout;
  //   if (index < data.collection.data.length) {
  //     timer = setTimeout(() => setEntries(entries.concat(data.collection.data[index]!)), 50);
  //   }
  //   return (() => {
  //     clearTimeout(timer);
  //   });
  // }, [entries]);

  // return (
  //   <TransitionGroup className={`collection-grid-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
  //     {entries.map((entry) =>
  //       <CSSTransition key={data.collection.name + entry.id} in timeout={600} appear unmountOnExit classNames='transition-slide-up'>
  //         <Entry
  //           data={{ entry: entry, ...data }}
  //           isPreview
  //           className='preview-item'
  //           onLinkClicked={onEntryClicked}
  //           onClick={() => onEntryClicked(entry, data.collection, null, data.collection)} />
  //       </CSSTransition>
  //     )}
  //   </TransitionGroup>
  // );

  return (
    <div className={`collection-grid-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      {subsections?.map((subsection) =>
        <Subsection
          key={subsection}
          title={subsection}
          data={data}
          entries={data.collection.data.filter((entry) =>
            getValueOrLiteral({ entry, ...data }, entry.category ?? "") === subsection)}
          onEntryClicked={onEntryClicked} />
      )}
    </div>
  );
}

/**
 * Props for the Subsection
 */
interface ISubSectionProps {
  title: string,
  data: {
    pkg: IPackage,
    collection: ICollection
  },
  entries: IEntry[],
  onEntryClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
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
  const { title, data, entries, onEntryClicked } = props;

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
          isPreview
          className='preview-item'
          onLinkClicked={onEntryClicked}
          onClick={() => onEntryClicked(entry, data.collection, null, data.collection)} />
      )}
    </div>
  );
}