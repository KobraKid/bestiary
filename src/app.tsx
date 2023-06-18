import React, { useState } from 'react';
import * as ReactDOM from 'react-dom';
import { convertHtmlToReact } from '@hedgedoc/html-to-react';
import { CollectionMenu, PackageMenu } from './menu';
import { DISPLAY_MODE, useBestiaryViewModel } from './BestiaryViewModel';
import { PackageConfigContext, PackageContext } from './context';
import { ICollectionMetadata } from './model/Collection';
import IEntry from './model/Entry';
import { Entry } from './entry';
import './styles/app.scss';
import './styles/collection.scss';
import './styles/details.scss';
import './styles/transitions.scss';

/**
 * Represents a view frame for backwards navigation
 */
export interface ViewStackframe {
  /** The view's collection */
  collection: any,
  /** The view's entry - null or undefined if the previous frame was in collection mode */
  entry?: any,
}

/**
 * The app entry point
 * @returns The app
 */
const App: React.FC = () => {
  const [pkgMenuExpanded, setPkgMenuExpanded] = useState(false);
  const {
    pkg, selectPkg,
    collection, selectCollection,
    entry, selectEntry, collectEntry,
    pkgConfig, updatePkgConfig,
    displayMode,
    canNavigateBack, navigateBack
  } = useBestiaryViewModel();

  return (
    <PackageContext.Provider value={{ pkg, selectCollection, selectEntry }}>
      <PackageConfigContext.Provider value={{ pkgConfig }}>
        <PackageMenu
          expanded={pkgMenuExpanded}
          setExpanded={setPkgMenuExpanded}
          onPackageClicked={selectPkg} />
        {pkg &&
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <CollectionMenu
              collections={pkg.collections}
              pkgMenuExpanded={pkgMenuExpanded}
              canNavigateBack={canNavigateBack}
              onBackArrowClicked={navigateBack}
              onCollectionClicked={selectCollection} />
            <Page collection={collection} entry={entry} selectEntry={selectEntry} displayMode={displayMode} />
          </div>
        }
      </PackageConfigContext.Provider>
    </PackageContext.Provider>
  );
};

interface IPageProps {
  collection: ICollectionMetadata,
  entry: IEntry | null,
  selectEntry: (collection: ICollectionMetadata, entry: IEntry) => void,
  displayMode: DISPLAY_MODE
}

const Page: React.FC<IPageProps> = (props: IPageProps) => {
  const { collection, entry, selectEntry, displayMode } = props;
  switch (displayMode) {
    case DISPLAY_MODE.collection:
      return (
        <div className='collection-grid'>
          {collection.style && convertHtmlToReact(collection.style)}
          {collection.entries?.map(entry => <Entry key={entry.entryId} entry={entry} onClick={() => selectEntry(collection, entry)} />)}
        </div>
      );
    case DISPLAY_MODE.entry:
      return (
        <div className='details'>
          {entry?.style && convertHtmlToReact(entry.style)}
          <Entry entry={entry} onClick={() => { }} />
        </div>
      );
    default:
      return null;
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
