import React from 'react';
import { IPackageData } from './interfaces/IPackage';
import { ILayoutElement } from './interfaces/ILayout';
import { Entry } from './entry';

interface IDetailsProps {
  data: IPackageData | null | undefined,
  layout: ILayoutElement | null | undefined,
  path: string,
  onReturnToCollectionClicked: () => void,
}

export const Details = (props: IDetailsProps) => {
  const { data, layout, path, onReturnToCollectionClicked } = props;

  return (
    <div className="details">
      <div onClick={onReturnToCollectionClicked}>◀</div>
      <Entry data={data} layout={layout} path={path} />
    </div>
  );
}
