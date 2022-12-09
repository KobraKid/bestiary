import React, { Fragment, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { CollectionMenu, PackageMenu } from './menu';
import { Collection } from './collection';
import { Details } from './details';
import IPackage from './model/Package';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { MapView } from './mapView';
import { CollectionManager } from './collectionManager';
import { IPackageConfig } from './model/Config';
import { DISPLAY_MODE, useBestiaryViewModel } from './BestiaryViewModel';
import './styles/app.scss';
import './styles/transitions.scss';
import CollectionContext from './context';

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
  const [managedCollection, setManagedCollection] = useState<ICollection | null>(null);

  // Handle right clicking on a collection
  useEffect(() => window.menu.manageCollection(collectionName => {
    const managedCollection = pkg?.collections.find(collection => collection.name === collectionName);
    if (managedCollection) {
      setManagedCollection(managedCollection);
      setShowCollectionManager(true);
    }
  }), [pkg]);

  return (
    <CollectionContext.Provider value={collection}>
      <PackageMenu
        expanded={pkgMenuExpanded}
        setExpanded={setPkgMenuExpanded}
        onPackageClicked={selectPkg} />
      {pkg &&
        <Fragment>
          <CollectionMenu
            collections={pkg.collections}
            pkgMenuExpanded={pkgMenuExpanded}
            canNavigateBack={canNavigateBack}
            onBackArrowClicked={navigateBack}
            onCollectionClicked={selectCollection} />
          {collection &&
            <Page
              pkg={pkg}
              pkgConfig={pkgConfig}
              pkgMenuexpanded={pkgMenuExpanded}
              collection={collection}
              entry={entry}
              onEntryClicked={selectEntry}
              onEntryCollected={collectEntry}
              displayMode={displayMode} />
          }
          <CollectionManager
            show={showCollectionManager}
            pkg={pkg}
            collection={managedCollection}
            onAccept={() => {
              setShowCollectionManager(false);
              updatePkgConfig();
            }}
            onCancel={() => setShowCollectionManager(false)} />
        </Fragment>
      }
    </CollectionContext.Provider>
  );
};

/**
 * Props for the Page
 */
interface IPageProps {
  pkg: IPackage,
  pkgConfig: IPackageConfig,
  pkgMenuexpanded: boolean,
  collection: ICollection,
  entry: IEntry | null,
  onEntryClicked: (newEntry: IEntry, newCollection: ICollection, prevEntry: IEntry | null, prevCollection: ICollection) => void,
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
    pkg, pkgConfig, pkgMenuexpanded,
    collection,
    entry, onEntryClicked, onEntryCollected,
    displayMode
  } = props;

  return (
    <Fragment>
      {displayMode === DISPLAY_MODE.collection &&
        <Collection
          data={{ pkg: pkg, collection: collection }}
          collectionConfig={pkgConfig && pkgConfig[collection.name]}
          pkgMenuExpanded={pkgMenuexpanded}
          onEntryClicked={onEntryClicked}
          onEntryCollected={onEntryCollected} />}
      {displayMode === DISPLAY_MODE.entry &&
        <Details
          data={{ pkg: pkg, collection: collection, entry: entry || null }}
          pkgMenuExpanded={pkgMenuexpanded}
          onEntryClicked={onEntryClicked} />}
      {displayMode === DISPLAY_MODE.map &&
        <MapView
          data={{ pkg: pkg, collection: collection, entry: entry || null }}
          pkgMenuExpanded={pkgMenuexpanded}
          onEntryClicked={onEntryClicked} />}
    </Fragment>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
