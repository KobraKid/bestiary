import React, { Fragment, useCallback, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
// import { CSSTransition } from 'react-transition-group';
import { CollectionMenu, PackageMenu } from './menu';
import { Collection } from './collection';
import { Details } from './details';
import IPackage from './model/Package';
import ICollection from './model/Collection';
import IEntry from './model/Entry';
import { LAYOUT_TYPE } from './model/Layout';
import { MapView } from './mapView';
import './styles/app.scss';
import './styles/transitions.scss';
import { CollectionManager } from './collectionManager';

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
          setCollection={setSelectedCollection}
          entry={selectedEntry}
          setEntry={setSelectedEntry}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          viewStack={viewStack}
          addViewStackframe={(view: ViewStackframe) => setViewStack(stack => stack.concat(view))}
          removeViewStackframe={() => setViewStack(stack => stack.slice(0, -1))} />
        : null
      }
      <CollectionManager
        show={showCollectionManager}
        pkg={selectedPkg}
        collection={managedCollection}
        onAccept={() => setShowCollectionManager(false)}
        onCancel={() => setShowCollectionManager(false)} />
    </Fragment>
  );
};

/**
 * Props for the Page
 */
interface IPageProps {
  pkg: IPackage,
  pkgMenuexpanded: boolean,
  collection: ICollection,
  setCollection: React.Dispatch<React.SetStateAction<ICollection | null>>,
  entry: IEntry | null,
  setEntry: React.Dispatch<React.SetStateAction<IEntry | null>>,
  displayMode: DISPLAY_MODE,
  setDisplayMode: React.Dispatch<React.SetStateAction<DISPLAY_MODE | null>>,
  viewStack: ViewStackframe[],
  addViewStackframe: (view: ViewStackframe) => void,
  removeViewStackframe: () => void,
}

/**
 * The page is the main content region of the app
 * @param props Page props
 * @returns The page
 */
const Page = (props: IPageProps) => {
  const {
    pkg, pkgMenuexpanded,
    collection, setCollection,
    entry, setEntry,
    displayMode, setDisplayMode,
    viewStack, addViewStackframe, removeViewStackframe
  } = props;

  useEffect(() => {
    if (displayMode === DISPLAY_MODE.map && collection.data.length > 0) {
      //setEntry(collection.data[0]!);
    }
  }, [displayMode]);

  // Select a new entry - enter detailed entry view
  const onEntryClickedCallback = useCallback((newEntry: IEntry, newCollection: ICollection, prevEntry: IEntry | null, prevCollection: ICollection) => {
    const view = { collection: prevCollection, entry: prevEntry }

    if (newCollection.layout.type === LAYOUT_TYPE.map) {
      setDisplayMode(DISPLAY_MODE.map);
    } else {
      setDisplayMode(DISPLAY_MODE.entry);
    }

    setEntry(null);
    setCollection(newCollection);
    setEntry(newEntry);

    addViewStackframe(view);
    console.log("→ going from", prevCollection.name, prevEntry?.id ?? "collection", "to", newCollection.name, newEntry.id);
  }, []);

  // Go back one level
  const onReturnClickedCallback = useCallback((views: ViewStackframe[]) => {
    console.log("← returning to", views.length < 1 ? "nowhere" : views[views.length - 1]!.collection.name + " " + (views[views.length - 1]!.entry?.id ?? "collection"));
    if (views.length < 1) { return; } // nowhere to back out to

    const view = views[views.length - 1]!;

    if (view.entry) {
      if (isMapView(view.collection)) {
        setDisplayMode(DISPLAY_MODE.map);
      } else {
        setDisplayMode(DISPLAY_MODE.entry);
      }
    } else {
      setDisplayMode(DISPLAY_MODE.collection);
    }

    setEntry(null);
    setCollection(view.collection);
    setEntry(view.entry);

    removeViewStackframe();
  }, []);

  return (
    <Fragment>
      {/*<CSSTransition in={displayMode === DISPLAY_MODE.collection} timeout={300} appear unmountOnExit exit={false} classNames='transition-fade'>*/}
      {displayMode === DISPLAY_MODE.collection &&
        <Collection
          data={{ pkg: pkg, collection: collection }}
          pkgMenuExpanded={pkgMenuexpanded}
          onEntryClicked={onEntryClickedCallback} />}
      {/*</CSSTransition>*/}
      {/*<CSSTransition in={displayMode === DISPLAY_MODE.entry} timeout={600} appear unmountOnExit exit={false} classNames='transition-slide-in'>*/}
      {displayMode === DISPLAY_MODE.entry &&
        <Details
          data={{ pkg: pkg, collection: collection, entry: entry }}
          pkgMenuExpanded={pkgMenuexpanded}
          onEntryClicked={onEntryClickedCallback}
          onReturnToCollectionClicked={() => onReturnClickedCallback(viewStack)} />}
      {/*</CSSTransition>*/}
      {/*<CSSTransition in={displayMode === DISPLAY_MODE.map} timeout={300} appear unmountOnExit exit={false} classNames='transition-fade'>*/}
      {displayMode === DISPLAY_MODE.map &&
        <MapView
          data={{ pkg: pkg, collection: collection, entry: entry }}
          pkgMenuExpanded={pkgMenuexpanded}
          onEntryClicked={onEntryClickedCallback} />}
      {/*</CSSTransition>*/}
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
