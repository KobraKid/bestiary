import React, { Fragment, useCallback, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import { CollectionMenu, PackageMenu } from './menu';
import { Collection } from './collection';
import { Details } from './details';
import IPackage, { ICollection, IEntry } from './interfaces/IPackage';
import './styles/app.scss';
import './styles/transitions.scss';

const enum DISPLAY_MODE {
  collection,
  entry,
}

const App = () => {
  const [pkgMenuExpanded, setPkgMenuExpanded] = useState(false);
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
    <Fragment>
      <PackageMenu
        expanded={pkgMenuExpanded}
        setExpanded={setPkgMenuExpanded}
        onPackageClicked={onPkgClickedCallback} />
      {selectedPkg ?
        <CollectionMenu
          collections={selectedPkg.collections}
          pkgMenuExpanded={pkgMenuExpanded}
          onCollectionClicked={onCollectionClickedCallback} />
        : null
      }
      {(selectedPkg && selectedCollection) ?
        <Page
          pkg={selectedPkg}
          pkgMenuexpanded={pkgMenuExpanded}
          collection={selectedCollection}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode} />
        : null
      }
    </Fragment>
  );
};

interface IPageProps {
  pkg: IPackage,
  collection: ICollection,
  displayMode: DISPLAY_MODE,
  setDisplayMode: (mode: DISPLAY_MODE) => void,
  pkgMenuexpanded: boolean,
}

const Page = (props: IPageProps) => {
  const { pkg, collection, displayMode, setDisplayMode, pkgMenuexpanded } = props;

  const [selectedEntry, setSelectedEntry] = useState<IEntry | null>(null);

  const onEntryClickedCallback = useCallback((entry: IEntry) => {
    setDisplayMode(DISPLAY_MODE.entry);
    setSelectedEntry(entry);
  }, []);

  const onReturnToCollectionCallback = useCallback(() => {
    setDisplayMode(DISPLAY_MODE.collection);
    setSelectedEntry(null);
  }, []);

  return (
    <Fragment>
      <CSSTransition in={displayMode === DISPLAY_MODE.collection} timeout={600} appear unmountOnExit classNames='transition-fade'>
        <Collection
          pkg={pkg}
          pkgMenuExpanded={pkgMenuexpanded}
          collection={collection}
          onEntryClicked={onEntryClickedCallback} />
      </CSSTransition>
      <CSSTransition in={displayMode === DISPLAY_MODE.entry} timeout={300} appear unmountOnExit classNames='transition-fade'>
        <Details
          pkg={pkg}
          pkgMenuExpanded={pkgMenuexpanded}
          collection={collection}
          entry={selectedEntry}
          onReturnToCollectionClicked={onReturnToCollectionCallback} />
      </CSSTransition>
    </Fragment>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
