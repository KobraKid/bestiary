import React, { useCallback, useEffect, useState } from 'react';
import IPackage, { IPackageMetadata } from './model/Package';
import ICollection from './model/Collection';
import './styles/menu.scss';
import upArrow from './assets/icons/up.png';
import downArrow from './assets/icons/down.png';
import leftArrow from './assets/icons/left.png';

/**
 * Props for the package menu
 */
interface IPackageMenuProps {
  /**
   * Whether the menu is expanded
   */
  expanded: boolean,
  /**
   * Sets whether the menu is expanded
   */
  setExpanded: (expanded: boolean) => void,
  /**
   * The callback handler for when a package is clicked
   */
  onPackageClicked: (pkg: IPackage) => void,
}

/**
 * The package menu
 * @param props The props
 * @returns A menu
 */
export const PackageMenu = (props: IPackageMenuProps) => {
  const { expanded, setExpanded, onPackageClicked } = props;

  const [packages, setPackages] = useState(new Array<IPackageMetadata>());

  const onPkgClickedCallback = useCallback((path: string) => {
    window.pkg.loadPackage(path).then((result: IPackage | null) => {
      if (result) {
        setExpanded(false);
        onPackageClicked(result);
      }
    });
  }, []);

  useEffect(() => {
    window.pkg.loadPackages().then((result: any) => setPackages(result as IPackageMetadata[]));
  }, [setPackages]);

  return (
    <div className='package-menu'>
      {packages.map((pkg: IPackageMetadata) =>
        <PackageMenuItem
          key={pkg.name}
          name={pkg.name}
          icon={pkg.path + '\\' + pkg.icon}
          expanded={expanded}
          onPkgClicked={() => onPkgClickedCallback(pkg.path)} />)
      }
      <div style={{ flexGrow: '1', height: '100%' }}>
        <img src={expanded ? upArrow : downArrow} style={{ float: 'right', padding: 16, width: 32, height: 32, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)} />
      </div>
    </div>
  );
}

/**
 * Props for the package menu item
 */
interface IPackageMenuItemProps {
  /**
   * Package name
   */
  name: string,
  /**
   * Packagen icon
   */
  icon: string,
  /**
   * Display the item expanded
   */
  expanded: boolean,
  /**
   * Callback for when the package is clicked
   */
  onPkgClicked: () => void,
}

/**
 * A package for display in the menu
 * @param props The props
 * @returns A package
 */
const PackageMenuItem = (props: IPackageMenuItemProps) => {
  const { name, icon, expanded, onPkgClicked } = props;

  return (
    <button className={`package-menu-button-${expanded ? 'expanded' : 'collapsed'}`} onClick={onPkgClicked}>
      <div className='package'>
        <img className='package-icon' src={icon} alt={name} />
        <div className='package-name'>
          <p>{name}</p>
        </div>
      </div>
    </button>
  );
}

/**
 * Props for the collection menu
 */
interface ICollectionMenuProps {
  collections: ICollection[],
  onCollectionClicked: (collection: ICollection) => void,
  isTopLevel: boolean,
  onBackArrowClicked: () => void,
  pkgMenuExpanded: boolean,
}

/**
 * The collection menu
 * @param props The props
 * @returns A menu
 */
export const CollectionMenu = (props: ICollectionMenuProps) => {
  const { collections, onCollectionClicked, isTopLevel, onBackArrowClicked, pkgMenuExpanded } = props;

  return (
    <div className={`collection-menu-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      {!isTopLevel &&
        <div className='collection-menu-button'>
          <img src={leftArrow} style={{ padding: 16, width: 32, height: 32, cursor: 'pointer' }} onClick={onBackArrowClicked} />
        </div>
      }
      {collections.map((collection: ICollection) =>
        !collection.hidden &&
        <CollectionMenuItem
          key={collection.name}
          name={collection.name}
          onCollectionClicked={() => onCollectionClicked(collection)}
          onCollectionRightClicked={() => window.menu.showCollectionMenu(collection.name)} />
      )}
    </div>
  );
}

/**
 * Props for the collection menu item
 */
interface ICollectionMenuItemProps {
  name: string,
  onCollectionClicked: () => void;
  onCollectionRightClicked: () => void;
}

/**
 * A collection for display in the menu
 * @param props The props
 * @returns A collection
 */
const CollectionMenuItem = (props: ICollectionMenuItemProps) => {
  const { name, onCollectionClicked, onCollectionRightClicked } = props;
  return (
    <button className='collection-menu-button' onClick={onCollectionClicked} onContextMenu={onCollectionRightClicked}>
      <p>{name}</p>
    </button>
  );
}