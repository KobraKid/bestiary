import React, { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { CollectionMenu, PackageMenu } from './menu';
import { Collection } from './collection';
import { Details } from './details';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { MapView } from './mapView';
import { CollectionManager } from './collectionManager';
import { DISPLAY_MODE, useBestiaryViewModel } from './BestiaryViewModel';
import { PackageConfigContext, CollectionContext, PackageContext } from './context';
import './styles/app.scss';
import './styles/transitions.scss';

/**
 * Represents a view frame for backwards navigation
 */
export interface ViewStackframe {
  /** The view's collection */
  collection: ICollection,
  /** The view's entry - null or undefined if the previous frame was in collection mode */
  entry?: IEntry,
}

/**
 * The app entry point
 * @returns The app
 */
const App = () => {
  const [pkgMenuExpanded, setPkgMenuExpanded] = useState(false);
  const {
    pkg, selectPkg,
    collection, selectCollection,
    entry, selectEntry, collectEntry,
    pkgConfig, updatePkgConfig,
    displayMode,
    canNavigateBack, navigateBack
  } = useBestiaryViewModel();
  const [showCollectionManager, setShowCollectionManager] = useState<boolean>(false);

  // Handle right clicking on a collection
  useEffect(() => window.menu.manageCollection(collectionName => {
    setShowCollectionManager(!!pkg?.collections.find(collection => collection.name === collectionName));
  }), [pkg]);

  return (
    <PackageContext.Provider value={{ pkg, selectCollection, selectEntry }}>
      <PackageConfigContext.Provider value={{ pkgConfig }}>
        <CollectionContext.Provider value={{ collection }}>
          <PackageMenu
            expanded={pkgMenuExpanded}
            setExpanded={setPkgMenuExpanded}
            onPackageClicked={selectPkg} />
          {pkg &&
            <>
              <CollectionMenu
                collections={pkg.collections}
                pkgMenuExpanded={pkgMenuExpanded}
                canNavigateBack={canNavigateBack}
                onBackArrowClicked={navigateBack}
                onCollectionClicked={selectCollection} />
              {collection &&
                <Page
                  pkgMenuexpanded={pkgMenuExpanded}
                  collection={collection}
                  entry={entry}
                  onEntryCollected={collectEntry}
                  displayMode={displayMode} />
              }
              <CollectionManager
                show={showCollectionManager}
                onAccept={() => {
                  setShowCollectionManager(false);
                  updatePkgConfig();
                }}
                onCancel={() => setShowCollectionManager(false)} />
            </>
          }
        </CollectionContext.Provider>
      </PackageConfigContext.Provider>
    </PackageContext.Provider>
  );
};

/**
 * Props for the Page
 */
interface IPageProps {
  pkgMenuexpanded: boolean,
  collection: ICollection,
  entry: IEntry | null,
  onEntryCollected: (entryId: string, collectionConfigId: number) => void,
  displayMode: DISPLAY_MODE
}

/**
 * The page is the main content region of the app
 * @param props Page props
 * @returns The page
 */
const Page = (props: IPageProps) => {
  const {
    pkgMenuexpanded,
    entry, onEntryCollected,
    displayMode
  } = props;

  return (
    <>
      {displayMode === DISPLAY_MODE.collection &&
        <Collection
          pkgMenuExpanded={pkgMenuexpanded}
          onEntryCollected={onEntryCollected} />}
      {displayMode === DISPLAY_MODE.entry &&
        <Details
          entry={entry}
          pkgMenuExpanded={pkgMenuexpanded} />}
      {displayMode === DISPLAY_MODE.map &&
        <MapView
          entry={entry}
          pkgMenuExpanded={pkgMenuexpanded} />}
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
