import React from 'react';
import { IDataProps, ILayoutElement, ILayoutProps, LAYOUT_TYPE } from '../model/Layout';
import { getStyle, getValueOrLiteral } from './base';
import { Number, Percent, String } from './basic';
import { Link } from './relation';
import { Sprite } from './images';
import '../styles/grid.scss';

// =============================================================================
// | Grid
// =============================================================================
export interface IGridLayoutProps extends ILayoutProps {
    label?: string,
    rows: string,
    cols: {
        type: LAYOUT_TYPE,
        header: string,
        style?: React.CSSProperties
    }[],
    /** <td/> style */
    styles?: React.CSSProperties[]
}

export interface IGridProps extends ILayoutElement {
    layout: IGridLayoutProps
}

export const Grid = (props: IGridProps) => {
    const { layout, data, onLinkClicked } = props;

    if (!layout.cols) { return null; }
    const rows = getValueOrLiteral(data, layout.rows);
    if (!Array.isArray(rows)) { return null; }
    const label = getValueOrLiteral(data, layout.label);
    const style = getStyle(data, layout.style);
    const tdStyles = layout.styles?.map(s => getStyle(data, s));
    const colStyles = layout.cols.map(col => getStyle(data, col.style));

    return (
        <React.Fragment>
            <span style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>{label}</span>
            <table className='grid' style={style}>
                <thead><tr>{layout.cols.map((col, c) => <th key={c} className='grid'>{col.header}</th>)}</tr></thead>
                <tbody>
                    {rows.map((row, r) => {
                        let vals = row.toString().split('||');
                        if (!Array.isArray(vals)) { return null; }
                        return <tr key={r}>
                            {layout.cols.map((col, c) => {
                                let val = vals[c]?.trim();
                                if (val === null || val === undefined) { return null; }
                                return (
                                    <td key={c} className='grid' style={tdStyles && tdStyles[c]}>
                                        {renderElementByType(col.type, c, val, data, colStyles[c], onLinkClicked)}
                                    </td>
                                );
                            }
                            )}
                        </tr>
                    })}
                </tbody>
            </table>
        </React.Fragment>
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

export interface IListProps extends ILayoutElement {
    layout: IListLayoutProps
}

export const List = (props: IListProps) => {
    const { layout, data, onLinkClicked } = props;

    const label = getValueOrLiteral(data, layout.label);
    const elements = getValueOrLiteral(data, layout.elements);
    if (!Array.isArray(elements)) { return null; }
    const style = getStyle(data, layout.style);
    style.display = 'flex';
    style.flexDirection = layout.vertical ? 'column' : 'row';
    const elementStyles = layout.elementStyles?.map(s => getStyle(data, s));

    return (
        <React.Fragment>
            <span style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>{label}</span>
            <div style={style}>
                {elements.map((element, i) => {
                    if (element === null || element === undefined) { return null; }
                    return renderElementByType(layout.elementTypes, i, element as string, data, elementStyles ? elementStyles[i] : undefined, onLinkClicked);
                })}
            </div>
        </React.Fragment>
    );
}

/**
 * Renders a single element of a Grid or List
 * 
 * @param layout The layout type for this element
 * @param key Unique identifier for this element
 * @param element The element to render
 * @param data The package data
 * @param style The style to apply to this element
 * @param onLinkClicked The link clicked handler
 * @returns An element to be rendered in a Grid or List
 */
function renderElementByType(layout: LAYOUT_TYPE, key: any, element: string, data: IDataProps, style?: React.CSSProperties, onLinkClicked?: any): JSX.Element | null {
    switch (layout) {
        case LAYOUT_TYPE.string:
            return <String key={key} layout={{ value: element, style: style }} data={data} />;
        case LAYOUT_TYPE.number:
            return <Number key={key} layout={{ value: element, style: style }} data={data} />;
        case LAYOUT_TYPE.percent:
            return <Percent key={key} layout={{ value: element, style: style }} data={data} />;
        case LAYOUT_TYPE.link:
            return <Link key={key} layout={{ link: element, style: style }} data={data} onLinkClicked={onLinkClicked} />;
        case LAYOUT_TYPE.sprite:
            return <Sprite key={key} layout={{ value: element, style: style }} data={data} />;
        default:
            return null;
    }
}