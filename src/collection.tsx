import React from 'react';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import { Entry } from './entry';

interface ICollectionProps {
  pkg: IPackage,
  collection: ICollection,
  onEntryClicked: (entry: IEntry) => void,
}

export const Collection = (props: ICollectionProps) => {
  const { pkg, collection, onEntryClicked } = props;

  const entryList = [];
  for (let entry of collection.data) {
    entryList.push(
      <Entry
        key={entry.id}
        pkg={pkg}
        attributes={entry.attributes}
        layout={collection.layoutPreview}
        className="preview-item"
        onClick={() => onEntryClicked(entry)} />
    );
  }

  return (
    <div className="collection-grid">
      {entryList}
    </div>
  );
}
