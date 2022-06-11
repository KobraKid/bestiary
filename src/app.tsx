import React, { useCallback, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { ToolbarCollectionList, ToolbarPackageList } from './toolbar';
import { Collection } from './collection';
import { Details } from './details';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import './styles/app.scss';

const enum DISPLAY_MODE {
  collection,
  entry,
}

const App = () => {
  const [selectedPkg, setSelectedPkg] = useState<IPackage | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<ICollection | null>(null);
  const [displayMode, setDisplayMode] = useState<DISPLAY_MODE>(DISPLAY_MODE.collection);

  const onPkgClickedCallback = useCallback((pkg: IPackage) => {
    setSelectedPkg(pkg);
    setSelectedCollection(null);
    setDisplayMode(DISPLAY_MODE.entry);
  }, []);

  const onCollectionClickedCallback = useCallback((collection: ICollection) => {
    setSelectedCollection(collection);
    setDisplayMode(DISPLAY_MODE.collection);
  }, []);

  return (
    <React.Fragment>
      <ToolbarPackageList
        onPackageClicked={onPkgClickedCallback} />
      {selectedPkg ? 
        <ToolbarCollectionList
          collections={selectedPkg.collections} 
          onCollectionClicked={onCollectionClickedCallback} /> 
        : null
      }
      {(selectedPkg && selectedCollection) ?
        <Page
          pkg={selectedPkg} 
          collection={selectedCollection}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode} />
        : null
      }
    </React.Fragment>
  );
};

interface IPageProps {
  pkg: IPackage,
  collection: ICollection,
  displayMode: DISPLAY_MODE,
  setDisplayMode: (mode: DISPLAY_MODE) => void,
}

const Page = (props: IPageProps) => {
  const { pkg, collection, displayMode, setDisplayMode } = props;

  const [selectedEntry, setSelectedEntry] = useState<IEntry | null>(null);

  const onEntryClickedCallback = useCallback((entry: IEntry) => {
    setDisplayMode(DISPLAY_MODE.entry);
    setSelectedEntry(entry);
  }, []);

  const onReturnToCollectionCallback = useCallback(() => {
    setDisplayMode(DISPLAY_MODE.collection);
    setSelectedEntry(null);
  }, []);

  switch (displayMode) {
    case DISPLAY_MODE.collection:
      return (
        <Collection
          pkg={pkg}
          collection={collection}
          onEntryClicked={onEntryClickedCallback} />
      );
    case DISPLAY_MODE.entry:
      return (
        <Details
            pkg={pkg}
            collection={collection}
            entry={selectedEntry}
            onReturnToCollectionClicked={onReturnToCollectionCallback} />
      );
    default:
      return null;
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
