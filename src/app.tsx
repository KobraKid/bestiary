import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { convertHtmlToReact } from '@hedgedoc/html-to-react';
import { CollectionMenu, PackageMenu } from './menu';
import { DISPLAY_MODE, useBestiaryViewModel } from './BestiaryViewModel';
import { PackageConfigContext, PackageContext } from './context';
import { ICollectionMetadata } from './model/Collection';
import { IEntryMetadata } from './model/Entry';
import { Entry } from './entry';
import './styles/app.scss';
import './styles/collection.scss';
import './styles/details.scss';
import './styles/transitions.scss';
import './styles/importer.scss';

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
    collection, selectCollection, getCollectionEntry,
    entry, selectEntry, collectEntry,
    pkgConfig, updatePkgConfig,
    displayMode,
    canNavigateBack, navigateBack
  } = useBestiaryViewModel();

  useEffect(() => {
    window.pkg.onLoadCollectionEntry(getCollectionEntry);
  }, []);

  return (
    <div className={pkgMenuExpanded ? 'app-pkg-menu-expanded' : 'app-pkg-menu-collapsed'}>
      <ImportView />
      <PackageContext.Provider value={{ pkg, selectCollection, selectEntry }}>
        <PackageConfigContext.Provider value={{ pkgConfig }}>
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
              <Page collection={collection} entry={entry} selectEntry={selectEntry} displayMode={displayMode} />
            </>
          }
        </PackageConfigContext.Provider>
      </PackageContext.Provider>
    </div>
  );
};

interface IPageProps {
  collection: ICollectionMetadata,
  entry: IEntryMetadata | null,
  selectEntry: (collection: ICollectionMetadata, entry: IEntryMetadata) => void,
  displayMode: DISPLAY_MODE
}

const Page: React.FC<IPageProps> = (props: IPageProps) => {
  const { collection, entry, selectEntry, displayMode } = props;

  const entriesPerPage = 50;

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [grouping, setGrouping] = useState<string>("");
  useEffect(() => {
    setGrouping("");
  }, [collection.ns]);
  const onGroup = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setGrouping(event.target.value);
  }, []);

  const prevPage = useCallback(() => setCurrentPage(page => Math.max(page - 1, 1)), []);
  const nextPage = useCallback((totalPages: number) => setCurrentPage(page => Math.min(page + 1, totalPages)), []);

  useEffect(() => {
    if (collection?.entries?.length) {
      const pages = Math.max(Math.ceil(collection.entries.length / entriesPerPage), 1);
      setTotalPages(pages);
      setCurrentPage(page => page > pages ? 1 : page);
    }
    else {
      setTotalPages(1);
      setCurrentPage(1);
    }
  }, [collection]);

  switch (displayMode) {
    case DISPLAY_MODE.collection:
      return (
        <>
          <div className='collection-grid'>
            {((collection?.groupings?.length ?? -1) > 0) &&
              <div className='grouping-selection'>
                <select name='groupings' value={grouping} onChange={onGroup}>
                  <option value="">None</option>
                  {collection.groupings.map(grouping => <option key={grouping.attribute} value={grouping.attribute}>{grouping.name}</option>)}
                </select>
              </div>
            }
            <br />
            {collection.style && convertHtmlToReact(collection.style)}
            {collection.entries?.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage).map(entry =>
              <Entry key={entry.bid} entry={entry} onClick={() => selectEntry(collection, entry)} />
            )}
          </div>
          <div className='collection-page-select'>
            <button onClick={prevPage}>◀</button>
            {`Page ${currentPage} of ${totalPages}`}
            <button onClick={() => nextPage(totalPages)}>▶</button>
          </div>
        </>
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

enum ImportState {
  NOT_IMPORTING,
  IMPORTING,
  IMPORT_COMPLETE,
  IMPORT_FAILED
}

const ImportView: React.FC = () => {
  const [importState, setImportState] = useState<ImportState>(ImportState.NOT_IMPORTING);
  const [importMessage, setImportMessage] = useState<string>("");

  useEffect(() => {
    window.importer.importStart(() => {
      setImportState(ImportState.IMPORTING);
    });

    window.importer.importUpdate((update: string) => {
      setImportMessage(update);
    })

    window.importer.importComplete(() => {
      setImportState(ImportState.IMPORT_COMPLETE);
      setTimeout(() => setImportState(ImportState.NOT_IMPORTING), 800);
    });

    window.importer.importFailed(() => {
      setImportState(ImportState.IMPORT_FAILED);
      setTimeout(() => setImportState(ImportState.NOT_IMPORTING), 800);
    });
  }, []);

  if (importState === ImportState.NOT_IMPORTING) { return null; }

  return (
    <div className='import-mask'>
      {importState === ImportState.IMPORTING &&
        <>
          <div className='import-loading' />
          <div className='import-message'>{importMessage}</div>
        </>
      }
      {importState === ImportState.IMPORT_COMPLETE &&
        <div className='import-loading-complete'>
          <svg height='150' width='200'>
            <path d='M180 0 L200 20 L70 150 L0 80 L20 60 L70 110 Z' stroke='#00CC00' fill='#00CC00' />
          </svg>
        </div>
      }
      {importState === ImportState.IMPORT_FAILED &&
        <div className='import-loading-failed'>
          <svg height='200' width='200'>
            <path d='M0 20 L20 0 L100 80 L180 0 L200 20 L120 100 L200 180 L180 200 L100 120 L20 200 L0 180 L80 100 Z' stroke='#CC0000' fill='#CC0000' />
          </svg>
        </div>
      }
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
