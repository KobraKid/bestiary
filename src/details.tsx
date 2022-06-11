import React from 'react';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import { Entry } from './entry';

interface IDetailsProps {
  pkg: IPackage,
  collection: ICollection,
  entry: IEntry | null,
  onReturnToCollectionClicked: () => void,
}

export const Details = (props: IDetailsProps) => {
  const { pkg, collection, entry, onReturnToCollectionClicked } = props;

  if (!entry) {
    return null;
  }

  return (
    <div className="details">
      <div onClick={onReturnToCollectionClicked}>◀</div>
      <Entry
        pkg={pkg}
        attributes={entry.attributes}
        layout={collection.layout} />
    </div>
  );
}
