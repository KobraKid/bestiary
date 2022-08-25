import React, { useCallback, useEffect, useState } from 'react';
import IPackage, { IPackageMetadata } from './model/Package';
import ICollection from './model/Collection';
import './styles/menu.scss';
import upArrow from './assets/icons/up.png';
import downArrow from './assets/icons/down.png';

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
    window.electronAPI.loadPackage(path).then((result: IPackage | null) => {
      if (result) {
        setExpanded(false);
        onPackageClicked(result);
      }
    });
  }, []);

  useEffect(() => {
    window.electronAPI.loadPackages().then((result: any) => setPackages(result as IPackageMetadata[]));
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
      {expanded ?
        <div style={{ flexGrow: '1', height: '100%' }}>
          <img src={upArrow} style={{ float: 'right', padding: 16, width: 32, height: 32 }} onClick={() => setExpanded(false)} />
        </div> :
        <div style={{ flexGrow: '1', height: '100%' }}>
          <img src={downArrow} style={{ float: 'right', padding: 16, width: 32, height: 32 }} onClick={() => setExpanded(true)} />
        </div>
      }
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

interface ICollectionMenuProps {
  collections: ICollection[],
  onCollectionClicked: (collection: ICollection) => void,
  pkgMenuExpanded: boolean,
}

export const CollectionMenu = (props: ICollectionMenuProps) => {
  const { collections, onCollectionClicked, pkgMenuExpanded } = props;

  return (
    <div className={`collection-menu-${pkgMenuExpanded ? 'expanded' : 'collapsed'}`}>
      {collections.map((collection: ICollection) =>
        <CollectionMenuItem
          key={collection.name}
          name={collection.name}
          onCollectionClicked={() => onCollectionClicked(collection)} />
      )}
    </div>
  );
}

interface ICollectionMenuItemProps {
  name: string,
  onCollectionClicked: () => void;
}

const CollectionMenuItem = (props: ICollectionMenuItemProps) => {
  const { name, onCollectionClicked } = props;
  return (
    <button className='collection-menu-button' onClick={onCollectionClicked}>
      <p>{name}</p>
    </button>
  );
}