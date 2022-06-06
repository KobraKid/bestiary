import React from 'react';
import IPackage, { IPackageData } from './interfaces/IPackage';
import { ILayoutElement } from './interfaces/ILayout';
import { Entry } from './entry';

interface ICollectionProps {
  pkgData: IPackageData[] | null | undefined,
  layout: ILayoutElement | null | undefined,
  path: string,
  onPreviewClicked: (entry: IPackageData) => void,
}

export const Collection = (props: ICollectionProps) => {
  const { pkgData, layout, path, onPreviewClicked } = props;

  if (!pkgData) {
    return null;
  }

  const entryList = [];
  for (let entry of pkgData) {
    entryList.push(
      <Entry
        key={entry.id}
        data={entry.data}
        layout={layout}
        path={path}
        className="preview-item"
        onClick={() => onPreviewClicked(entry)} />
    );
  }

  return (
    <div className="collection-grid">
      {entryList}
    </div>
  );
}
