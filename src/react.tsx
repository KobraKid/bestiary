import React, { useCallback, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { Toolbar } from './toolbar';
import { Collection } from './collection';
import { Details } from './details';
import IPackage, { IPackageData } from './interfaces/IPackage';
import './styles/app.scss';

const App = () => {
  const [selectedPkg, setSelectedPkg] = useState<IPackage | null>(null);
  const [isCollection, setIsCollection] = useState<boolean>(true);
  const [detailData, setDetailData] = useState<any | null>(null);

  const onPreviewClickedCallback = useCallback((entry: IPackageData) => {
    setIsCollection(false);
    setDetailData(entry.data);
  }, []);

  const onReturnToCollectionCallback = useCallback(() => {
    setIsCollection(true);
    setDetailData(null);
  }, []);

  useEffect(() => {
    setIsCollection(true);
    setDetailData(null);
  }, [selectedPkg]);

  return (
    <React.Fragment>
      <Toolbar
        title={selectedPkg ? selectedPkg.metadata.name : "Bestiary"}
        updatePkg={setSelectedPkg} />
      {isCollection ?
        <Collection
          pkgData={selectedPkg?.data}
          layout={selectedPkg?.layoutPreview}
          path={selectedPkg?.metadata?.path ?? ""}
          onPreviewClicked={onPreviewClickedCallback} />
        : <Details
            data={detailData}
            layout={selectedPkg?.layout}
            path={selectedPkg?.metadata?.path ?? ""}
            onReturnToCollectionClicked={onReturnToCollectionCallback} />
      }
    </React.Fragment>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
