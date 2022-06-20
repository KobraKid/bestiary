import React, { useEffect, useState } from 'react';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import { Entry } from './entry';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './styles/transitions.scss';

interface ICollectionProps {
  pkg: IPackage,
  pkgMenuExpanded: boolean,
  collection: ICollection,
  onEntryClicked: (entry: IEntry, collection: ICollection) => void,
}

export const Collection = (props: ICollectionProps) => {
  const { pkg, pkgMenuExpanded, collection, onEntryClicked } = props;

  const [entries, setEntries] = useState<Array<IEntry>>([]);

  useEffect(() => {
    setEntries([]);
  }, [pkg, collection]);

  useEffect(() => {
    for (let entry of collection.data) {
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
        <CSSTransition key={collection.name + entry.id} in timeout={600} appear unmountOnExit classNames='transition-slide-up'>
          <Entry
            pkg={pkg}
            attributes={entry.attributes}
            layout={collection.layoutPreview}
            className='preview-item'
            onLinkClicked={onEntryClicked}
            onClick={() => onEntryClicked(entry, collection)} />
        </CSSTransition>
      )}
    </TransitionGroup>
  );
}