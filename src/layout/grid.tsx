import React, { useContext, useEffect, useMemo } from 'react';
import { ILayoutProps, LAYOUT_TYPE } from '../model/Layout';
import { Base, getStyle, getValueOrLiteral } from './base';
import { INumberLayoutProps, IPercentLayoutProps, IStringLayoutProps } from './basic';
import { ILinkLayoutProps } from './relation';
import { ISpriteLayoutProps } from './images';
import { EntryContext, PackageContext } from '../context';
import IEntry from '../model/Entry';
import '../styles/grid.scss';

// =============================================================================
// | Grid
// =============================================================================
export interface IGridLayoutProps extends ILayoutProps {
    label?: string,
    border?: boolean,
    rows: string,
    cols: {
        type: LAYOUT_TYPE,
        header: string,
        style?: React.CSSProperties
    }[],
    /** <td/> style */
    styles?: React.CSSProperties[]
}

export const Grid = () => {
    const { pkg } = useContext(PackageContext);
    const { entry, layout } = useContext(EntryContext);
    const gridLayout = layout as IGridLayoutProps;

    if (!gridLayout.cols) { return null; }
    const rows = useMemo(() => getValueOrLiteral(entry, pkg, gridLayout.rows), [entry]);
    if (!Array.isArray(rows)) { return null; }

    const label = useMemo(() => getValueOrLiteral(entry, pkg, gridLayout.label), [entry]);
    const gridClass = useMemo(() => 'grid' + (getValueOrLiteral(entry, pkg, gridLayout.border) ? '-border' : ''), [entry]);
    const style = useMemo(() => getStyle(entry, pkg, gridLayout.style), [gridLayout.style]);
    const tdStyles = useMemo(() => gridLayout.styles?.map(s => getStyle(entry, pkg, s)), [gridLayout.styles]);
    const colStyles = useMemo(() => gridLayout.cols.map(col => getStyle(entry, pkg, col.style)), [gridLayout.cols]);

    return (
        <div style={style}>
            {label && <span style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>{label}</span>}
            <table className={gridClass}>
                <thead><tr>{gridLayout.cols.map((col, c) => <th key={c} className={gridClass}>{col.header}</th>)}</tr></thead>
                <tbody>
                    {rows.map((row, r) => {
                        const rowData = row.toString().split('||');
                        if (!Array.isArray(rowData)) { return null; }
                        return (
                            <tr key={rowData.toString() + r}>
                                {gridLayout.cols.map((col, c) => {
                                    const data = rowData[c]?.trim();
                                    if (data === null || data === undefined) { return null; }
                                    return (
                                        <td key={col.type + data + c} className={gridClass} style={tdStyles && tdStyles[c]}>
                                            {renderElementByType(entry, col.type, data, colStyles[c])}
                                        </td>
                                    );
                                }
                                )}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}

// =============================================================================
// | List
// =============================================================================

export interface IListLayoutProps extends ILayoutProps {
    label?: string,
    elements: string,
    elementTypes: LAYOUT_TYPE,
    elementStyles?: React.CSSProperties[],
    vertical?: boolean
}

export const List = () => {
    const { pkg } = useContext(PackageContext);
    const { entry, layout } = useContext(EntryContext);
    const listLayout = layout as IListLayoutProps;

    const label = useMemo(() => getValueOrLiteral(entry, pkg, listLayout.label), [entry]);
    const elements = useMemo(() => getValueOrLiteral(entry, pkg, listLayout.elements), [entry]);
    if (!Array.isArray(elements)) { return null; }
    const style = useMemo(() => {
        const style = getStyle(entry, pkg, listLayout.style);
        style.display = 'flex';
        style.flexDirection = listLayout.vertical ? 'column' : 'row';
        return style;
    }, [listLayout.style]);
    const elementStyles = useMemo(() => listLayout.elementStyles?.map(s => getStyle(entry, pkg, s)), [listLayout.elementStyles]);

    return (
        <>
            <span style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>{label}</span>
            <div style={style}>
                {elements.map((element, i) => {
                    if (element === null || element === undefined) { return null; }
                    return (
                        <React.Fragment key={element.toString() + i}>
                            {renderElementByType(entry, listLayout.elementTypes, element as string, elementStyles ? elementStyles[i] : undefined)}
                        </React.Fragment>
                    );
                })}
            </div>
        </>
    );
}

/**
 * Renders a single element of a Grid or List
 *
 * @param layoutType The layout type for this element
 * @param data The data to render
 * @param style The style to apply to this element
 * @returns An element to be rendered in a Grid or List
 */
function renderElementByType(entry: IEntry, layoutType: LAYOUT_TYPE, data: string, style?: React.CSSProperties): JSX.Element | null {
    const baseLayout: ILayoutProps = {
        type: layoutType,
        style: style
    };

    switch (layoutType) {
        case LAYOUT_TYPE.string:
        case LAYOUT_TYPE.number:
        case LAYOUT_TYPE.percent:
        case LAYOUT_TYPE.sprite:
            const valueLayout: IStringLayoutProps | INumberLayoutProps | IPercentLayoutProps | ISpriteLayoutProps = {
                ...baseLayout,
                value: data
            }
            return (
                <EntryContext.Provider value={{ entry, layout: valueLayout }}>
                    <Base />
                </EntryContext.Provider>
            );
        case LAYOUT_TYPE.link:
            const linkLayout: ILinkLayoutProps = {
                ...baseLayout,
                link: data
            }
            return (
                <EntryContext.Provider value={{ entry, layout: linkLayout }}>
                    <Base />
                </EntryContext.Provider>
            );
        default:
            return null;
    }
}