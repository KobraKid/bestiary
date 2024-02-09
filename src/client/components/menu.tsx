import React, { useCallback, useContext, useEffect, useState } from "react";
import { IPackageMetadata } from "../../model/Package";
import { IGroupMetadata } from "../../model/Group";
import "../styles/menu.scss";
import upArrow from "../../assets/icons/up.png";
import downArrow from "../../assets/icons/down.png";
import leftArrow from "../../assets/icons/left.png";
import { PackageContext } from "../context";

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
    onPackageClicked: (pkg: IPackageMetadata) => void,
}

/**
 * The package menu
 * @param props The props
 * @returns A menu
 */
export const PackageMenu = (props: IPackageMenuProps) => {
    const { expanded, setExpanded, onPackageClicked } = props;

    const [packages, setPackages] = useState(new Array<IPackageMetadata>());

    const onPkgClickedCallback = useCallback((pkg: IPackageMetadata) => {
        setExpanded(false);
        onPackageClicked(pkg);
    }, []);

    useEffect(() => {
        window.pkg.loadPackages().then((result: IPackageMetadata[]) => setPackages(result));
    }, []);

    return (
        <div className="package-menu">
            {packages.map((pkg: IPackageMetadata) =>
                <PackageMenuItem
                    key={pkg.name}
                    name={pkg.name}
                    icon={pkg.icon}
                    expanded={expanded}
                    onPkgClicked={() => onPkgClickedCallback(pkg)} />)
            }
            <div className="arrow-container">
                <img src={expanded ? upArrow : downArrow} onClick={() => setExpanded(!expanded)} />
            </div>
        </div>
    );
};

/**
 * Props for the package menu item
 */
interface IPackageMenuItemProps {
    /**
     * Package name
     */
    name: string,
    /**
     * Package icon
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
        <button className={`package-menu-button-${expanded ? "expanded" : "collapsed"}`} onClick={onPkgClicked}>
            <div className="package">
                <img className="package-icon" src={icon} alt={name} />
                <div className="package-name">
                    <p>{name}</p>
                </div>
            </div>
        </button>
    );
};

/**
 * Props for the group menu
 */
interface IGroupMenuProps {
    groups: IGroupMetadata[],
    onGroupClicked: (group: IGroupMetadata) => void,
    canNavigateBack: boolean,
    onBackArrowClicked: () => void,
    pkgMenuExpanded: boolean,
}

/**
 * The Group menu
 * @param props The props
 * @returns A menu
 */
export const GroupMenu = (props: IGroupMenuProps) => {
    const { groups, onGroupClicked, canNavigateBack, onBackArrowClicked, pkgMenuExpanded } = props;
    const { pkg } = useContext(PackageContext);

    return (
        <div className={`group-menu-${pkgMenuExpanded ? "expanded" : "collapsed"}`}>
            {canNavigateBack &&
                <div className="group-menu-button">
                    <img src={leftArrow} style={{ padding: 16, width: 32, height: 32, cursor: "pointer" }} onClick={onBackArrowClicked} />
                </div>
            }
            {groups.filter(group => !group.hidden).map(group =>
                <GroupMenuItem
                    key={group.ns}
                    name={group.name}
                    onGroupClicked={() => onGroupClicked(group)}
                    onGroupRightClicked={() => window.menu.showGroupMenu(pkg, group)} />
            )}
        </div>
    );
};

/**
 * Props for the group menu item
 */
interface IGroupMenuItemProps {
    name: string,
    onGroupClicked: () => void;
    onGroupRightClicked: () => void;
}

/**
 * A group for display in the menu
 * @param props The props
 * @returns A group
 */
const GroupMenuItem = (props: IGroupMenuItemProps) => {
    const { name, onGroupClicked, onGroupRightClicked } = props;

    return (
        <button className="group-menu-button" onClick={onGroupClicked} onContextMenu={onGroupRightClicked}>
            <p>{name}</p>
        </button>
    );
};