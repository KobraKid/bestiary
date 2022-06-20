import React from 'react';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import { Entry } from './entry';
import './styles/details.scss';
import leftArrow from './assets/icons/left.png';

interface IDetailsProps {
  pkg: IPackage,
  pkgMenuExpanded: boolean,
  collection: ICollection,
  entry: IEntry | null,
  onEntryClicked: (entry: IEntry, collection: ICollection) => void,
  onReturnToCollectionClicked: () => void,
}

export const Details = (props: IDetailsProps) => {
  const { pkg, pkgMenuExpanded, collection, entry, onEntryClicked, onReturnToCollectionClicked } = props;

  if (!entry) {
    return null;
  }

  return (
    <div className={`details-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      <div>
        <img src={leftArrow} style={{ padding: 16, width: 32, height: 32 }} onClick={onReturnToCollectionClicked} />
      </div>
      <Entry
        pkg={pkg}
        attributes={entry.attributes}
        layout={collection.layout}
        onLinkClicked={onEntryClicked} />
    </div>
  );
}
