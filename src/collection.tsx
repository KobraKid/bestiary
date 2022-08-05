import React, { useEffect, useState } from 'react';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import { Entry } from './entry';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './styles/transitions.scss';

interface ICollectionProps {
  pkg: IPackage,
  pkgMenuExpanded: boolean,
  collection: ICollection,
  onEntryClicked: (entry: IEntry) => void,
}

export const Collection = (props: ICollectionProps) => {
  const { pkg, pkgMenuExpanded, collection, onEntryClicked } = props;

  const [entries, setEntries] = useState<Array<IEntry>>([]);

  useEffect(() => {
    setEntries([]);
  }, [pkg, collection]);

  useEffect(() => {
    const index = entries.length;
    if (index < collection.data.length) {
      setTimeout(() => setEntries(entries.concat(collection.data[index]!)), 50);
    }
  }, [entries]);

  return (
    <TransitionGroup className={`collection-grid-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      {entries.map((entry) =>
        <CSSTransition key={collection.name + entry.id} in timeout={600} appear unmountOnExit classNames="transition-slide-up">
          <Entry
            pkg={pkg}
            attributes={entry.attributes}
            layout={collection.layoutPreview}
            className='preview-item'
            onClick={() => onEntryClicked(entry)} />
        </CSSTransition>
      )}
    </TransitionGroup>
  );
}