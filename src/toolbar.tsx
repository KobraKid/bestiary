import React, { useCallback, useEffect, useState } from 'react';
import IPackage, { IPackageMetadata } from './interfaces/IPackage';
import './styles/toolbar.scss';

interface IToolbarProps {
  title: string,
  updatePkg: (pkg: IPackage) => void;
}

export const Toolbar = (props: IToolbarProps) => {
  const { title, updatePkg } = props;

  const [packages, setPackages] = useState(new Array<IPackageMetadata>());

  const onPkgClickedCallback = useCallback((path: string) => {
    window.electronAPI.loadPackage(path).then((result: IPackage | null) => {
      if (result) {
        updatePkg(result);
      }
    });
  }, []);

  useEffect(() => {
    window.electronAPI.loadPackages().then((result: any) => setPackages(result as IPackageMetadata[]));
  }, [setPackages]);

  return (
    <div>
      <span>{title}</span>
      <div className="toolbar">
        {packages.map((pkg: IPackageMetadata) => <ToolbarPackage key={pkg.name} name={pkg.name} icon={pkg.path + "\\" + pkg.icon} onPkgClicked={() => onPkgClickedCallback(pkg.path)} />)}
      </div>
    </div>
  );
}

interface IToolbarPackageProps {
  name: string,
  icon: string,
  onPkgClicked: () => void
}

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
