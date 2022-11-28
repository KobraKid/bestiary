import React, { Fragment, useCallback, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { CollectionMenu, PackageMenu } from './menu';
import { Collection } from './collection';
import { Details } from './details';
import IPackage from './model/Package';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { LAYOUT_TYPE } from './model/Layout';
import { MapView } from './mapView';
import { CollectionManager } from './collectionManager';
import { IPackageConfig } from './model/Config';
import './styles/app.scss';
import './styles/transitions.scss';

/**
 * Display mode
 */
const enum DISPLAY_MODE {
  /** Collection */
  collection,
  /** Detailed entry */
  entry,
  /** Map view */
  map,
}

/**
 * Represents a view frame for backwards navigation
 */
export interface ViewStackframe {
  /** The view's collection */
  collection: ICollection,
  /** The view's entry - null if the previous frame was in collection mode */
  entry: IEntry | null,
}

/**
 * The app entry point
 * @returns The app
 */
const App = () => {
  const [pkgMenuExpanded, setPkgMenuExpanded] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<IPackage | null>(null);
  const [pkgConfig, setPkgConfig] = useState<IPackageConfig | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<ICollection | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<IEntry | null>(null);
  const [displayMode, setDisplayMode] = useState<DISPLAY_MODE>(DISPLAY_MODE.collection);
  const [viewStack, setViewStack] = useState<ViewStackframe[]>([]);
  const [showCollectionManager, setShowCollectionManager] = useState<boolean>(false);
  const [managedCollection, setManagedCollection] = useState<ICollection | null>(null);

  // Open a new package
  const onPkgClickedCallback = useCallback((pkg: IPackage) => {
    if (selectedPkg?.metadata.name === pkg.metadata.name) { return; }

    setViewStack([]);
    setSelectedCollection(null);

    const collection = pkg.collections.length > 0 ? pkg.collections[0]! : null;
    if (collection?.layout.type === LAYOUT_TYPE.map) {
      setDisplayMode(DISPLAY_MODE.map);
    } else {
      setDisplayMode(DISPLAY_MODE.collection);
    }

    setSelectedPkg(pkg);
    setSelectedCollection(collection);
    window.config.loadPkgConfig(pkg).then(config => setPkgConfig(config));
  }, [selectedPkg]);

  // Switch to a different collection
  const onCollectionClickedCallback = useCallback((collection: ICollection) => {
    if (selectedCollection?.name === collection.name) { return; }

    setViewStack([]);
    setSelectedCollection(null);

    if (isMapView(collection)) {
      setSelectedEntry(null);
      setDisplayMode(DISPLAY_MODE.map);
      setSelectedEntry(collection.data[0] ?? null);
    } else {
      setDisplayMode(DISPLAY_MODE.collection);
    }

    setSelectedCollection(collection);
  }, [selectedCollection, selectedPkg]);

  const onEntryCollectedCallback = useCallback((entryId: string, collection: string, collectionConfigId: number, pkg: IPackage) => {
    setPkgConfig(pkgConfig => {
      // Clone current config
      const newPkgConfig: IPackageConfig = JSON.parse(JSON.stringify(pkgConfig));
      if (newPkgConfig) {
        // Get the collection configs for the current collection
        const collectionConfigs = newPkgConfig[collection];
        if (collectionConfigs) {
          // Get the specific config we're changing
          const configToEdit = collectionConfigs.find(config => config.id === collectionConfigId);
          if (configToEdit) {
            // Remove the ID if it already exists, otherwise add it
            const newEntries = configToEdit.collectedEntryIds.includes(entryId) ?
              configToEdit.collectedEntryIds.filter(entry => entry !== entryId)
              : configToEdit.collectedEntryIds.concat(entryId);
            // Save the change
            configToEdit.collectedEntryIds = newEntries;
            window.config.savePkgConfig(pkg.metadata.path, newPkgConfig);
            return newPkgConfig;
          }
        }
      }
      return pkgConfig;
    });
  }, []);

  // Select a new entry - enter detailed entry view
  const onEntryClickedCallback = useCallback((newEntry: IEntry, newCollection: ICollection, prevEntry: IEntry | null, prevCollection: ICollection) => {
    const view = { collection: prevCollection, entry: prevEntry }

    if (newCollection.layout.type === LAYOUT_TYPE.map) {
      setDisplayMode(DISPLAY_MODE.map);
    } else {
      setDisplayMode(DISPLAY_MODE.entry);
    }

    setSelectedEntry(null);
    setSelectedCollection(newCollection);
    setSelectedEntry(newEntry);

    setViewStack(stack => stack.concat(view));
    window.log.write(`→ going from [${prevCollection.name} ${prevEntry?.id ?? "collection"}] to [${newCollection.name} ${newEntry.id}]`);
  }, []);

  // Go back one level
  const onReturnClickedCallback = useCallback((views: ViewStackframe[]) => {
    window.log.write(`← returning to [${views.length < 1 ? "...nowhere..." : views[views.length - 1]?.collection.name} ${views[views.length - 1]?.entry?.id ?? "collection"}]`);
    if (views.length < 1) { return; } // nowhere to back out to

    const view = views[views.length - 1]!;

    if (isMapView(view.collection)) {
      setDisplayMode(DISPLAY_MODE.map);
    } else {
      if (view.entry) {
        setDisplayMode(DISPLAY_MODE.entry);
      } else {
        setDisplayMode(DISPLAY_MODE.collection);
      }
    }

    setSelectedEntry(null);
    setSelectedCollection(view.collection);
    setSelectedEntry(view.entry);

    setViewStack(stack => stack.slice(0, -1));
  }, []);

  // Handle right clicking on a collection
  useEffect(() => window.menu.manageCollection(collectionName => {
    const managedCollection = selectedPkg?.collections.find(collection => collection.name === collectionName);
    if (managedCollection) {
      setManagedCollection(managedCollection);
      setShowCollectionManager(true);
    }
  }), [selectedPkg]);

  return (
    <Fragment>
      <PackageMenu
        expanded={pkgMenuExpanded}
        setExpanded={setPkgMenuExpanded}
        onPackageClicked={onPkgClickedCallback} />
      {selectedPkg &&
        <CollectionMenu
          collections={selectedPkg.collections}
          pkgMenuExpanded={pkgMenuExpanded}
          isTopLevel={viewStack.length === 0}
          onBackArrowClicked={() => onReturnClickedCallback(viewStack)}
          onCollectionClicked={onCollectionClickedCallback} />}
      {(selectedPkg && selectedCollection) &&
        <Page
          pkg={selectedPkg}
          pkgConfig={pkgConfig}
          pkgMenuexpanded={pkgMenuExpanded}
          collection={selectedCollection}
          entry={selectedEntry}
          onEntryClicked={onEntryClickedCallback}
          onEntryCollected={(entryId: string, collectionConfigId: number) =>
            onEntryCollectedCallback(entryId, selectedCollection.name, collectionConfigId, selectedPkg)}
          displayMode={displayMode} />}
      <CollectionManager
        show={showCollectionManager}
        pkg={selectedPkg}
        collection={managedCollection}
        onAccept={() => {
          setShowCollectionManager(false);
          selectedPkg && window.config.loadPkgConfig(selectedPkg).then(config => setPkgConfig(config));
        }}
        onCancel={() => setShowCollectionManager(false)} />
    </Fragment>
  );
};

/**
 * Props for the Page
 */
interface IPageProps {
  pkg: IPackage,
  pkgConfig: IPackageConfig | null,
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
          data={{ pkg: pkg, collection: collection, entry: entry }}
          pkgMenuExpanded={pkgMenuexpanded}
          onEntryClicked={onEntryClicked} />}
      {displayMode === DISPLAY_MODE.map &&
        <MapView
          data={{ pkg: pkg, collection: collection, entry: entry }}
          pkgMenuExpanded={pkgMenuexpanded}
          onEntryClicked={onEntryClicked} />}
    </Fragment>
  );
}

/**
 * Checks if a collection is a Map
 * 
 * @param collection The collection to test
 * @returns Whether the collection's type is `LAYOUT_TYPE.map`
 */
function isMapView(collection: ICollection): boolean {
  return collection.layout?.type === LAYOUT_TYPE.map;
}

ReactDOM.render(<App />, document.getElementById('app'));
