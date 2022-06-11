import React, { useCallback, useEffect, useState } from 'react';
import IPackage, { ICollection, IPackageMetadata } from './interfaces/IPackage';
import './styles/toolbar.scss';

/**
 * Props for the package list toolbar
 */
interface IToolbarPackageListProps {
  /**
   * The callback handler for when a package is clicked
   */
  onPackageClicked: (pkg: IPackage) => void,
}

/**
 * The package list toolbar
 * @param props `ToolbarPackageList` props
 * @returns A toolbar
 */
export const ToolbarPackageList = (props: IToolbarPackageListProps) => {
  const { onPackageClicked } = props;

  const [packages, setPackages] = useState(new Array<IPackageMetadata>());

  const onPkgClickedCallback = useCallback((path: string) => {
    window.electronAPI.loadPackage(path).then((result: IPackage | null) => {
      if (result) {
        onPackageClicked(result);
      }
    });
  }, []);

  useEffect(() => {
    window.electronAPI.loadPackages().then((result: any) => setPackages(result as IPackageMetadata[]));
  }, [setPackages]);

  return (
    <div className="toolbar">
      {packages.map((pkg: IPackageMetadata) => <ToolbarPackage key={pkg.name} name={pkg.name} icon={pkg.path + "\\" + pkg.icon} onPkgClicked={() => onPkgClickedCallback(pkg.path)} />)}
    </div>
  );
}

/**
 * Props for the package toolbar item
 */
interface IToolbarPackageProps {
  /**
   * Package name
   */
  name: string,
  /**
   * Packagen icon
   */
  icon: string,
  /**
   * Callback for when the package is clicked
   */
  onPkgClicked: () => void,
}

/**
 * A package for display in the toolbar
 * @param props `ToolbarPackage` props
 * @returns A package
 */
const ToolbarPackage = (props: IToolbarPackageProps) => {
  const { name, icon, onPkgClicked } = props;

  return (
      <button className="toolbar-button" onClick={onPkgClicked}>
        <div>
          <img src={icon} alt={name}/>
          <div>
            <p>{name}</p>
          </div>
        </div>
      </button>
  );
}

interface IToolbarCollectionListProps {
  collections: ICollection[],
  onCollectionClicked: (collection: ICollection) => void,
}

export const ToolbarCollectionList = (props: IToolbarCollectionListProps) => {
  const { collections, onCollectionClicked } = props;

  return (
    <div>
      {collections.map((collection: ICollection) => 
        <ToolbarCollection
          key={collection.name} 
          name={collection.name} 
          onCollectionClicked={() => onCollectionClicked(collection)} />
      )}
    </div>
  );
}

interface IToolbarCollectionProps {
  name: string,
  onCollectionClicked: () => void;
}

const ToolbarCollection = (props: IToolbarCollectionProps) => {
  const { name, onCollectionClicked } = props;
  return (
    <button className="toolbar-button" onClick={onCollectionClicked}>
      <p>{name}</p>
    </button>
  );
}