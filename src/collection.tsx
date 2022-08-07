import React, { useEffect, useState } from 'react';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import { Entry } from './entry';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './styles/transitions.scss';

/**
 * Props for the Collection
 */
interface ICollectionProps {
  data: {
    pkg: IPackage,
    collection: ICollection
  }
  /** Whether the package menu is expanded */
  pkgMenuExpanded: boolean,
  /** Callback function for when an entry is clicked */
  onEntryClicked: (newEntry: IEntry, newCollection: ICollection, selectedEntry: IEntry | null, selectedCollection: ICollection) => void,
}

export const Collection = (props: ICollectionProps) => {
  const { data, pkgMenuExpanded, onEntryClicked } = props;

  const [entries, setEntries] = useState<Array<IEntry>>([]);

  useEffect(() => {
    setEntries([]);
  }, [data]);

  useEffect(() => {
    for (let entry of data.collection.data) {
      if (entries.find(e => e.id === entry.id)) {
        continue;
      }
      setTimeout(() => setEntries(entries.concat(entry)), 50);
      break;
    }
  }, [entries]);

  return (
    <TransitionGroup className={`collection-grid-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      {entries.map((entry) =>
        <CSSTransition key={data.collection.name + entry.id} in timeout={600} appear unmountOnExit classNames='transition-slide-up'>
          <Entry
            data={{ entry: entry, ...data }}
            isPreview
            className='preview-item'
            onLinkClicked={onEntryClicked}
            onClick={() => onEntryClicked(entry, data.collection, null, data.collection)} />
        </CSSTransition>
      )}
    </TransitionGroup>
  );
}