import React, { MouseEvent, useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import IPackage, { IPackageMetadata } from './model/Package';
import ICollection, { buildCollection, copyCollection } from './model/Collection';
import IEntry, { buildEntry } from './model/Entry';
import { buildModel, copyModel, parseImportedDataToDataModel } from './model/Model';
import { Attribute, AttributeData, AttributeType, attributeTypes, AttributeValue } from './model/Attribute';
import { copyLayoutProps, ILayoutProps, LAYOUT_TYPE } from './model/Layout';
import { IHorizontalLayoutProps, IVerticalLayoutProps } from './layout/groupings';
import { INumberLayoutProps, IPercentLayoutProps, IRatioLayoutProps, IStringLayoutProps } from './layout/basic';
import { ISpriteListLayoutProps, ISpriteLayoutProps } from './layout/images';
import { ILinkLayoutProps, parseLink } from './layout/relation';
import { IGridLayoutProps } from './layout/grid';

const PkgBuilder = () => {
    const [name, setName] = useState<string>('<Name>');
    const [icon, setIcon] = useState<string>('<Icon>');
    const [color, setColor] = useState<string>('#000000');
    const [defs, setDefs] = useState<object>({});
    const [defString, setDefString] = useState<string>('');

    const [collections, setCollections] = useState<ICollection[]>([]);
    const [displayedCollection, setDisplayedCollection] = useState<number>(0);
    const [models, setModels] = useState<Attribute[][]>([]);
    const [newCollectionName, setNewCollectionName] = useState<string>('');

    const [errorMessage, setErrorMessage] = useState<string>('');

    /* Create a new collection */
    const onNewCollectionCallback = (e: MouseEvent) => {
        e.preventDefault();

        setModels(models => models.concat(buildModel()));

        setCollections(collections => {
            let name = newCollectionName.trim();

            if (name.length < 1) {
                setErrorMessage(`Invalid collection name`);
                return collections;
            }
            else if (collections.find(collection => collection.name === name)) {
                setErrorMessage(`Collection '${name}' already exists`);
                return collections;
            }

            setErrorMessage('');
            return collections.concat(buildCollection(name));
        });
    };

    /* Update a collection name */
    const updateCollectionName = useCallback((collectionIndex: number, update: string) => {
        setCollections(collections => {
            let updatedCollections = collections.map(collection => copyCollection(collection));
            let name = newCollectionName.trim();

            if (name.length < 1) {
                setErrorMessage(`Invalid collection name`);
                return collections;
            }
            else if (collections.find(collection => collection.name === name)) {
                setErrorMessage(`Collection '${name}' already exists`);
                return collections;
            }

            if (collectionIndex >= 0 && collectionIndex < updatedCollections.length) {
                let collectionToUpdate = updatedCollections[collectionIndex];
                if (collectionToUpdate) {
                    collectionToUpdate.name = update.trim();
                }
            }

            return updatedCollections;
        });
    }, []);

    /* Update an entry ID */
    const updateCollectionDataEntryId = useCallback((collectionIndex: number, entryIndex: number, model: Attribute[], update: string) => {
        setCollections(collections => {
            let updatedCollections: ICollection[] = collections.map(collection => copyCollection(collection));
            let id = update.trim();

            if (collectionIndex >= 0 && collectionIndex < updatedCollections.length) {
                let collectionToUpdate = updatedCollections[collectionIndex];
                if (collectionToUpdate) {
                    if (collectionToUpdate.data.find(entry => entry.id === id)) {
                        setErrorMessage(`An entry with id ${id} already exists`);
                        return collections;
                    }

                    if (entryIndex >= 0 && entryIndex < collectionToUpdate.data.length) {
                        let entryToUpdate = collectionToUpdate.data[entryIndex];
                        if (entryToUpdate) {
                            entryToUpdate.id = id;
                        }
                    }
                    else {
                        collectionToUpdate.data.push(buildEntryFromModel(id, model));
                    }
                }
            }

            return updatedCollections;
        });
    }, []);

    /* Update an entry attribute */
    const updateCollectionDataEntryAttribute = useCallback((collectionIndex: number, entryIndex: number, update: AttributeData) => {
        setCollections(collections => {
            let updatedCollections: ICollection[] = collections.map(collection => copyCollection(collection));

            if (collectionIndex >= 0 && collectionIndex < updatedCollections.length) {
                let collectionToUpdate = updatedCollections[collectionIndex];
                if (collectionToUpdate) {
                    if (entryIndex >= 0 && entryIndex < collectionToUpdate.data.length) {
                        let entryToUpdate = collectionToUpdate.data[entryIndex];
                        if (entryToUpdate) {
                            entryToUpdate.attributes = {
                                ...entryToUpdate.attributes,
                                ...update
                            };
                        }
                    }
                }
            }

            return updatedCollections;
        });
    }, []);

    const updateCollectionLayoutPreview = useCallback((collectionIndex: number, update: ILayoutProps) => {
        setCollections(collections => {
            let updatedCollections = collections.map(collection => copyCollection(collection));

            if (collectionIndex >= 0 && collectionIndex < updatedCollections.length) {
                let collectionToUpdate = updatedCollections[collectionIndex];
                if (collectionToUpdate) {
                    collectionToUpdate.layoutPreview = update;
                }
            }

            return updatedCollections;
        });
    }, []);

    const updateCollectionLayout = useCallback((collectionIndex: number, update: ILayoutProps) => {
        setCollections(collections => {
            let updatedCollections = collections.map(collection => copyCollection(collection));

            if (collectionIndex >= 0 && collectionIndex < updatedCollections.length) {
                let collectionToUpdate = updatedCollections[collectionIndex];
                if (collectionToUpdate) {
                    collectionToUpdate.layout = update;
                }
            }

            return updatedCollections;
        });
    }, []);

    /* Update a data model */
    const updateModel = useCallback((collectionIndex: number, attributeIndex: number, update: Attribute) => {
        setModels(models => {
            let updatedModels: Attribute[][] = models.map(model => copyModel(model));

            if (collectionIndex >= 0 && collectionIndex < updatedModels.length) {
                let modelToUpdate = updatedModels[collectionIndex];

                if (modelToUpdate) {
                    if (attributeIndex >= 0 && attributeIndex < modelToUpdate.length) {
                        modelToUpdate[attributeIndex]![0] = update[0];
                        modelToUpdate[attributeIndex]![1] = update[1];
                    }
                    else {
                        if (!modelToUpdate.find(attr => attr[0] === update[0])) {
                            modelToUpdate.push(update);
                        } else {
                            setErrorMessage(`Attribute '${update[0]}' already exists`);
                            return models;
                        }
                    }

                    setCollections(collections => {
                        if (collectionIndex >= 0 && collectionIndex < collections.length) {
                            let updatedCollections = collections.map(collection => copyCollection(collection));
                            updatedCollections[collectionIndex] = updateCollectionOnModelChange(updatedCollections[collectionIndex]!, modelToUpdate!);
                            return updatedCollections;
                        }
                        return collections;
                    });
                }
            }

            setErrorMessage('');
            return updatedModels;
        });
    }, []);

    /* Import an existing package */
    const importPkg = useCallback((importedPkg: File) => {
        importedPkg.text().then(data => window.electronAPI.parsePackage(data).then((pkg: IPackage | null) => {
            if (pkg) {
                setName(pkg.metadata.name);
                setIcon(pkg.metadata.icon);
                setColor(pkg.metadata.color);
                setDefs(pkg.metadata.defs);
                setDefString(buildStringFromDefs(pkg.metadata.defs));
                setModels(pkg.collections.map(collection => parseImportedDataToDataModel(collection.data)));
                setCollections(pkg.collections);
            }
        }));
    }, []);

    return (
        <div>
            <PkgDisplay name={name} icon={icon} color={color} defs={defs} collections={collections} />
            <label>
                Import&nbsp;
                <input type='file' accept='.json' onChange={e => e.target.files && e.target.files[0] && importPkg(e.target.files[0])} />
            </label>
            <hr />
            <table>
                <tbody>
                    <tr>
                        <td>
                            <label htmlFor='pkgName'>
                                Package name:&nbsp;
                            </label>
                        </td>
                        <td>
                            <input type='text' id='pkgName' value={name} onChange={e => setName(e.target.value)} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor='pkgIcon'>
                                Package icon:&nbsp;
                            </label>
                        </td>
                        <td>
                            <input type='text' id='pkgIcon' value={icon} onChange={e => setIcon(e.target.value)} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor='pkgColor'>
                                Package color:&nbsp;
                            </label>
                        </td>
                        <td>
                            <input type='color' id='pkgColor' value={color} onChange={e => setColor(e.target.value)} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor='pkgDefs'>
                                Package-level definitions:&nbsp;
                            </label>
                        </td>
                        <td>
                            <textarea
                                rows={8}
                                cols={80}
                                value={defString}
                                onChange={e => {
                                    setDefString(e.target.value);
                                    setDefs(buildDefsFromString(e.target.value));
                                }} />
                        </td>
                    </tr>
                </tbody>
            </table>
            <hr />
            <label>
                Selected collection:&nbsp;
                <select style={{ width: '150px', marginRight: '8px' }} value={displayedCollection} onChange={e => setDisplayedCollection(parseInt(e.target.value))}>
                    {collections.map((collection, i) => <option key={collection.name} value={i}>{collection.name}</option>)}
                </select>
            </label>
            <label>
                New collection:&nbsp;
                <input
                    type='text'
                    placeholder='Collection name'
                    value={newCollectionName}
                    onChange={e => { setNewCollectionName(e.target.value); setErrorMessage(''); }} />
            </label>
            <button onClick={onNewCollectionCallback}>Add Collection</button>
            <span style={{ backgroundColor: 'red', color: 'black', marginLeft: '8px', padding: '2px', display: errorMessage.length > 0 ? 'initial' : 'none' }}>
                {errorMessage}
            </span>
            <br />
            <CollectionDisplay
                key={displayedCollection}
                collection={collections[displayedCollection]}
                updateCollectionName={(name: string) => updateCollectionName(displayedCollection, name)}
                updateCollectionDataEntryId={(entryIndex: number, update: string) => updateCollectionDataEntryId(displayedCollection, entryIndex, models[displayedCollection]!, update)}
                updateCollectionDataEntryAttribute={(entryIndex: number, update: AttributeData) => updateCollectionDataEntryAttribute(displayedCollection, entryIndex, update)}
                updateCollectionLayoutPreview={(update: ILayoutProps) => updateCollectionLayoutPreview(displayedCollection, update)}
                updateCollectionLayout={(update: ILayoutProps) => updateCollectionLayout(displayedCollection, update)}
                model={models[displayedCollection]}
                updateModel={(attributeIndex: number, update: Attribute) => updateModel(displayedCollection, attributeIndex, update)}
                defs={defs} />
        </div>
    );
}

interface IPkgDisplayProps extends Omit<IPackageMetadata, 'path' | 'defs'> {
    defs: object,
    collections: ICollection[]
}

const PkgDisplay = (props: IPkgDisplayProps) => {
    const { name, icon, color, defs, collections } = props;

    const metadata: Omit<IPackageMetadata, 'path'> = useMemo(() => {
        return {
            name: name,
            icon: icon,
            color: color,
            defs: defs
        }
    }, [name, icon, color, defs]);

    const pkg = useMemo(() => {
        return {
            metadata: metadata,
            collections: collections
        }
    }, [metadata, collections]);

    return (
        <React.Fragment>
            <div>
                <textarea rows={10} cols={100} readOnly value={JSON.stringify(pkg ?? {}, null, '    ')} />
            </div>
        </React.Fragment>
    );
}

interface ICollectionDisplayProps {
    collection?: ICollection | null | undefined,
    updateCollectionName: (name: string) => void,
    updateCollectionDataEntryId: (entryIndex: number, update: string) => void,
    updateCollectionDataEntryAttribute: (entryIndex: number, update: AttributeData) => void,
    updateCollectionLayout: (update: ILayoutProps) => void,
    updateCollectionLayoutPreview: (update: ILayoutProps) => void,
    model?: Attribute[] | null | undefined,
    updateModel: (attributeIndex: number, update: Attribute) => void,
    defs: object
}

const CollectionDisplay = (props: ICollectionDisplayProps) => {
    const {
        collection,
        updateCollectionName,
        updateCollectionDataEntryId,
        updateCollectionDataEntryAttribute,
        updateCollectionLayout,
        updateCollectionLayoutPreview,
        model,
        updateModel,
        defs
    } = props;

    if (!collection || !model) { return null; }

    const [tab, setTab] = useState<number>(0);
    const [displayedEntry, setDisplayedEntry] = useState<number>(0);
    const [newEntryName, setNewEntryName] = useState<string>('');

    return (
        <div style={{ border: '1px solid black', padding: '8px', marginTop: '8px' }}>
            <input type='text' value={collection.name} onChange={e => updateCollectionName(e.target.value)} />
            <br />
            <button onClick={() => setTab(0)}>Layout preview</button>
            <button onClick={() => setTab(1)}>Layout</button>
            <button onClick={() => setTab(2)}>Entries</button>
            <br />
            <div style={{ height: '460px', overflow: 'auto' }}>
                {tab === 0 ?
                    <React.Fragment>
                        <span>Layout preview:</span>
                        <br />
                        <LayoutDisplay {...collection.layoutPreview} updateLayout={updateCollectionLayoutPreview} />
                    </React.Fragment>
                    : null
                }
                {tab === 1 ?
                    <React.Fragment>
                        <span>Layout:</span>
                        <br />
                        <LayoutDisplay {...collection.layout} updateLayout={updateCollectionLayout} />
                    </React.Fragment>
                    : null
                }
                {tab === 2 ?
                    <React.Fragment>
                        <span>Model:</span>
                        <table style={{ width: '100%' }}>
                            <tbody>
                                {model.map((attribute, i) =>
                                    <tr key={i} style={{ backgroundColor: i % 2 == 0 ? 'lightgray' : 'none' }}>
                                        <td style={{ width: '180px', padding: '4px' }}>
                                            <input type='text' value={attribute[0]} onChange={e => updateModel(i, [e.target.value, attribute[1]])} />
                                        </td>
                                        <td>
                                            <AttributeDisplay
                                                attr={attribute[1]}
                                                updateAttribute={(update: AttributeType) => updateModel(i, [attribute[0], update])} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <button onClick={() => updateModel(model.length, ['attribute', 'string'])}>New attribute</button>
                        <hr />
                        <label>
                            Selected entry:&nbsp;
                            <select style={{ width: '150px', marginRight: '8px' }} value={displayedEntry} onChange={e => setDisplayedEntry(parseInt(e.target.value))}>
                                {collection.data.map((entry, i) => <option key={entry.id} value={i}>{entry.id}</option>)}
                            </select>
                        </label>
                        <label>
                            New entry:&nbsp;
                            <input
                                type='text'
                                placeholder='Entry name'
                                value={newEntryName}
                                onChange={e => setNewEntryName(e.target.value)} />
                        </label>
                        <button onClick={() => updateCollectionDataEntryId(collection.data.length, newEntryName)}>New entry</button>
                        <br />
                        <EntryDisplay
                            key={displayedEntry}
                            entry={collection.data[displayedEntry]}
                            model={model}
                            updateEntryId={(update: string) => updateCollectionDataEntryId(displayedEntry, update)}
                            updateAttribute={(update: AttributeData) => updateCollectionDataEntryAttribute(displayedEntry, update)}
                            defs={defs} />
                    </React.Fragment>
                    : null
                }
            </div>
        </div>
    );
}

interface ILayoutDisplayProps extends ILayoutProps {
    updateLayout: (update: ILayoutProps) => void
}

const LayoutDisplay = (props: ILayoutDisplayProps) => {
    const { type, style, updateLayout } = props;

    let placeholder = ' or @def or !attribute';

    let typeSelect = (
        <select value={type} onChange={e => {
            let update = copyLayoutProps(props);
            update.type = e.target.value as LAYOUT_TYPE;
            switch (update.type) {
                case LAYOUT_TYPE.horizontal:
                case LAYOUT_TYPE.vertical:
                    (update as any).elements = [];
                    break;
            }
            updateLayout(update);
        }}>
            {Object.keys(LAYOUT_TYPE).map(key => <option key={key} value={key}>{key}</option>)}
        </select>
    )

    switch (type) {
        case LAYOUT_TYPE.string:
            return (
                <React.Fragment>
                    {typeSelect}
                    <input
                        type='text'
                        value={(props as unknown as IStringLayoutProps).label ?? ''}
                        placeholder={'label' + placeholder}
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as IStringLayoutProps);
                            update.label = e.target.value;
                            updateLayout(update);
                        }} />
                    <input
                        type='text'
                        value={(props as unknown as IStringLayoutProps).value ?? ''}
                        placeholder={'value' + placeholder}
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as IStringLayoutProps);
                            update.value = e.target.value;
                            updateLayout(update);
                        }} />
                    <span>
                        {(props as unknown as IStringLayoutProps).label ? (props as unknown as IStringLayoutProps).label + ': ' : ''}
                        {(props as unknown as IStringLayoutProps).value}
                    </span>
                </React.Fragment>
            );
        case LAYOUT_TYPE.number:
            return (
                <React.Fragment>
                    {typeSelect}
                    <input
                        type='text'
                        value={(props as unknown as INumberLayoutProps).label ?? ''}
                        placeholder={'label' + placeholder}
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as INumberLayoutProps);
                            update.label = e.target.value;
                            updateLayout(update);
                        }} />
                    <input
                        type='text'
                        value={(props as unknown as INumberLayoutProps).value ?? ''}
                        placeholder={'value' + placeholder}
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as INumberLayoutProps);
                            update.value = e.target.value;
                            updateLayout(update);
                        }} />
                    <span>
                        {(props as unknown as INumberLayoutProps).label ? (props as unknown as INumberLayoutProps).label + ': ' : ''}
                        {(props as unknown as INumberLayoutProps).value}
                    </span>
                </React.Fragment>
            );
        case LAYOUT_TYPE.ratio:
            return (
                <React.Fragment>
                    {typeSelect}
                    <input
                        type='text'
                        value={(props as unknown as IRatioLayoutProps).a ?? ''}
                        placeholder={'A' + placeholder}
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as IRatioLayoutProps);
                            update.a = e.target.value;
                            updateLayout(update);
                        }} />
                    <input
                        type='text'
                        value={(props as unknown as IRatioLayoutProps).b ?? ''}
                        placeholder={'B' + placeholder}
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as IRatioLayoutProps);
                            update.b = e.target.value;
                            updateLayout(update);
                        }} />
                    <input
                        type='text'
                        value={'' + (props as unknown as IRatioLayoutProps).showAsPercent}
                        placeholder={'show as percent (0 or 1)' + placeholder}
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as IRatioLayoutProps);
                            update.showAsPercent = e.target.value;
                            updateLayout(update);
                        }} />
                    <span>
                        {`${(props as unknown as IRatioLayoutProps).a ?? 0} : ${(props as unknown as IRatioLayoutProps).b ?? 0} (${+(props as unknown as IRatioLayoutProps).a / +(props as unknown as IRatioLayoutProps).b}%)`}
                    </span>
                </React.Fragment>
            );
        case LAYOUT_TYPE.percent:
            return (
                <React.Fragment>
                    {typeSelect}
                    <input
                        type='text'
                        value={(props as unknown as IPercentLayoutProps).label ?? ''}
                        placeholder='label or @def'
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as IPercentLayoutProps);
                            update.label = e.target.value;
                            updateLayout(update);
                        }} />
                    <input
                        type='text'
                        value={(props as unknown as IPercentLayoutProps).value ?? ''}
                        placeholder='value or @def or !attribute'
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as IPercentLayoutProps);
                            update.value = e.target.value;
                            updateLayout(update);
                        }} />
                    <span>
                        {(props as unknown as IPercentLayoutProps).label ? (props as unknown as IPercentLayoutProps).label + ': ' : ''}
                        {(props as unknown as IPercentLayoutProps).value}
                    </span>
                </React.Fragment>
            );
        case LAYOUT_TYPE.sprite:
            return (
                <React.Fragment>
                    {typeSelect}
                    <input
                        type='text'
                        value={(props as unknown as ISpriteLayoutProps).value ?? ''}
                        placeholder='value or @def or !attribute'
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as ISpriteLayoutProps);
                            update.value = e.target.value;
                            updateLayout(update);
                        }} />
                </React.Fragment>
            );
        case LAYOUT_TYPE.spritelist:
            return (
                <React.Fragment>
                    {typeSelect}
                    <button onClick={() => {
                        let update = copyLayoutProps(props as unknown as ISpriteListLayoutProps);
                        update.values.push('');
                        updateLayout(update);
                    }}>+</button>
                    <button onClick={() => {
                        let update = copyLayoutProps(props as unknown as ISpriteListLayoutProps);
                        update.values.pop();
                        updateLayout(update);
                    }}>-</button>
                    <div style={{ marginLeft: '8px' }}>
                        {(props as unknown as ISpriteListLayoutProps).values.map((value, i) =>
                            <React.Fragment>
                                <input
                                    key={i}
                                    value={value ?? ''}
                                    placeholder='value or @def or !attribute'
                                    onChange={e => {
                                        let update = copyLayoutProps(props as unknown as ISpriteListLayoutProps);
                                        update.values[i] = e.target.value;
                                        updateLayout(update);
                                    }} />
                                <br />
                            </React.Fragment>
                        )}
                    </div>
                </React.Fragment>
            );
        case LAYOUT_TYPE.link:
            return (
                <React.Fragment>
                    {typeSelect}
                    <input
                        value={(props as unknown as ILinkLayoutProps).link ?? ''}
                        placeholder='link or @def or !attribute'
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as ILinkLayoutProps);
                            update.link = e.target.value;
                            updateLayout(update);
                        }} />
                    <span>
                        {(typeof (props as unknown as ILinkLayoutProps).link === 'string'
                            && (props as unknown as ILinkLayoutProps).link.startsWith('~'))
                            ? `▶ ${parseLink((props as unknown as ILinkLayoutProps).link)[1]} (${parseLink((props as unknown as ILinkLayoutProps).link)[0]})`
                            : (props as unknown as ILinkLayoutProps).link}
                    </span>
                </React.Fragment>
            );
        case LAYOUT_TYPE.grid:
            return (
                <React.Fragment>
                    {typeSelect}
                    <input
                        value={(props as unknown as IGridLayoutProps).rows ?? ''}
                        placeholder='!attribute'
                        onChange={e => {
                            let update = copyLayoutProps(props as unknown as IGridLayoutProps);
                            update.rows = e.target.value;
                            updateLayout(update);
                        }} />
                    {(props as unknown as IGridLayoutProps).cols.map((col, i) =>
                        <div key={i} style={{ marginLeft: '8px' }}>
                            |<span style={{ color: 'gray', fontSize: '0.8em' }}>Column {i}</span>
                            <br />
                            |<select
                                value={col.type ?? ''}
                                onChange={e => {
                                    let update = copyLayoutProps(props as unknown as IGridLayoutProps);
                                    if (update.cols[i]) {
                                        update.cols[i]!.type = e.target.value as LAYOUT_TYPE;
                                    }
                                    updateLayout(update);
                                }}>
                                {Object.keys(LAYOUT_TYPE).map(key => <option key={key} value={key}>{key}</option>)}
                            </select>
                            <input
                                value={col.header ?? ''}
                                placeholder='header or @def or !attribute'
                                onChange={e => {
                                    let update = copyLayoutProps(props as unknown as IGridLayoutProps);
                                    if (update.cols[i]) {
                                        update.cols[i]!.header = e.target.value;
                                    }
                                    updateLayout(update);
                                }} />
                        </div>
                    )}
                </React.Fragment>
            );
        case LAYOUT_TYPE.horizontal:
            return (
                <React.Fragment>
                    {typeSelect}
                    <button onClick={() => {
                        let update = copyLayoutProps(props as unknown as IHorizontalLayoutProps);
                        update.elements.push({ type: LAYOUT_TYPE.string });
                        updateLayout(update);
                    }}>+</button>
                    <button onClick={() => {
                        let update = copyLayoutProps(props as unknown as IHorizontalLayoutProps);
                        update.elements.pop();
                        updateLayout(update);
                    }}>-</button>
                    {(props as unknown as IHorizontalLayoutProps).elements.map((element, i) =>
                        <div key={i} style={{ marginLeft: '8px' }}>
                            <LayoutDisplay {...element} updateLayout={updatedElement => {
                                let update = copyLayoutProps(props as unknown as IHorizontalLayoutProps);
                                update.elements[i] = updatedElement;
                                updateLayout(update);
                            }} />
                        </div>
                    )}
                </React.Fragment>
            );
        case LAYOUT_TYPE.vertical:
            return (
                <React.Fragment>
                    {typeSelect}
                    <button onClick={() => {
                        let update = copyLayoutProps(props as unknown as IVerticalLayoutProps);
                        update.elements.push({ type: LAYOUT_TYPE.string });
                        updateLayout(update);
                    }}>+</button>
                    <button onClick={() => {
                        let update = copyLayoutProps(props as unknown as IVerticalLayoutProps);
                        update.elements.pop();
                        updateLayout(update);
                    }}>-</button>
                    {(props as unknown as IVerticalLayoutProps).elements.map((element, i) =>
                        <div key={i} style={{ marginLeft: '8px' }}>
                            <LayoutDisplay {...element} updateLayout={updatedElement => {
                                let update = copyLayoutProps(props as unknown as IVerticalLayoutProps);
                                update.elements[i] = updatedElement;
                                updateLayout(update);
                            }} />
                        </div>
                    )}
                </React.Fragment>
            );
        default:
            return null;
    }
}

interface IAttributeDisplayProps {
    attr: AttributeType,
    updateAttribute: (update: AttributeType) => void
}

const AttributeDisplay = (props: IAttributeDisplayProps) => {
    const { attr, updateAttribute } = props;

    return (
        <React.Fragment>
            {(attr === 'string' || attr === 'number' || attr === 'boolean') ?
                <select value={attr} onChange={e => updateAttribute((e.target.value === 'array') ? [] : e.target.value as AttributeType)}>
                    {attributeTypes.map((attr, i) => <option key={i} value={attr}>{attr.toLowerCase()}</option>)}
                    <option value={'array'}>array</option>
                </select> :
                <React.Fragment>
                    <select value={'array'} onChange={e => updateAttribute((e.target.value === 'array') ? [] : e.target.value as AttributeType)}>
                        {attributeTypes.map((attr, i) => <option key={i} value={attr}>{attr.toLowerCase()}</option>)}
                        <option value={'array'}>array</option>
                    </select>
                    <button onClick={() => updateAttribute(attr.concat('string'))}>+</button>
                    <button onClick={() => updateAttribute(attr.slice(0, (attr.length > 0 ? attr.length - 1 : 0)))}>-</button>
                    <br />
                    {(attr as AttributeType[]).map((attrType, i) =>
                        <div key={i} style={{ marginLeft: '8px' }}>
                            <AttributeDisplay attr={attrType} updateAttribute={update => {
                                let newAttribute: AttributeType[] = Object.assign([], attr);
                                newAttribute[i] = update;
                                updateAttribute(newAttribute);
                            }} />
                        </div>
                    )}
                </React.Fragment>
            }
        </React.Fragment>
    );
}

interface IEntryDisplayProps {
    entry?: IEntry | null | undefined,
    model: Attribute[],
    defs: object,
    updateEntryId: (id: string) => void,
    updateAttribute: (update: AttributeData) => void
}

const EntryDisplay = (props: IEntryDisplayProps) => {
    const { entry, model, defs, updateEntryId, updateAttribute } = props;

    if (!entry) { return null; }

    return (
        <table>
            <tbody>
                <tr>
                    <td style={{ width: '100px' }}>
                        <label>id:&nbsp;</label>
                    </td>
                    <td>
                        <input type='text' value={entry.id} onChange={e => updateEntryId(e.target.value)} />
                    </td>
                </tr>
                {Object.keys(entry.attributes).map((key, i) =>
                    <tr key={key} style={{ backgroundColor: i % 2 == 0 ? 'lightgray' : 'none' }}>
                        <td style={{ width: '100px' }}>
                            {`${key}:`}
                        </td>
                        <td>
                            <AttributeValueDisplay
                                attr={model[i]![1]}
                                val={entry.attributes[key as keyof typeof entry.attributes]!}
                                defs={defs}
                                updateAttributeValue={(update: AttributeValue) => updateAttribute({ [key]: update })} />
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}

interface IAttributeValueDisplayProps {
    attr: AttributeType,
    val: AttributeValue,
    defs: object,
    updateAttributeValue: (update: AttributeValue) => void
}

const AttributeValueDisplay = (props: IAttributeValueDisplayProps) => {
    const { attr, val, defs, updateAttributeValue } = props;

    if (attr === 'string') {
        return (
            <React.Fragment>
                {/* raw string */}
                <input type='text' value={val as string} onChange={e => updateAttributeValue(e.target.value)} />
                {/* package-level definition (@) */}
                {((val as string)?.length > 0 && (val as string).startsWith('@')) &&
                    <React.Fragment>
                        {defs[(val as string).substring(1) as keyof typeof defs] ?
                            <React.Fragment>
                                {/* definition -> raw string */}
                                <span style={{ color: 'blue', marginLeft: '8px' }}>
                                    {defs[(val as string).substring(1) as keyof typeof defs]}
                                </span>
                                {((defs[(val as string).substring(1) as keyof typeof defs] as string).startsWith('~')) &&
                                    <React.Fragment>
                                        {/* definition -> link (~) */}
                                        <span style={{ color: 'blue', marginLeft: '8px' }}>
                                            {`▶ ${parseLink(defs[(val as string).substring(1) as keyof typeof defs] as string)[1]} (${parseLink(defs[(val as string).substring(1) as keyof typeof defs] as string)[0]})`}
                                        </span>
                                    </React.Fragment>
                                }
                            </React.Fragment> :
                            <React.Fragment>
                                {/* invalid definition */}
                                <span style={{ fontWeight: 'bold', color: 'red', marginLeft: '8px' }}>
                                    Package-level definition not found
                                </span>
                            </React.Fragment>
                        }
                    </React.Fragment>
                }
                {/* link (~) */}
                {((val as string)?.length > 0 && (val as string).startsWith('~')) &&
                    <React.Fragment>
                        <span style={{ color: 'blue', marginLeft: '8px' }}>
                            {`▶ ${(val as string).substring(1).split('|')[1]} (${(val as string).substring(1).split('|')[0]})`}
                        </span>
                    </React.Fragment>
                }
            </React.Fragment>
        );
    }
    else if (attr === 'number') {
        return <input type='number' value={val as number} onChange={e => updateAttributeValue(e.target.value)} />;
    }
    else if (attr === 'boolean') {
        return <input type='checkbox' checked={val as boolean} onChange={e => updateAttributeValue(e.target.checked)} />;
    }
    else {
        return (
            <React.Fragment>
                {(attr as AttributeType[]).map((attr, i) =>
                    <React.Fragment key={i}>
                        <AttributeValueDisplay
                            attr={attr}
                            val={(val as AttributeValue[])[i]!}
                            defs={defs}
                            updateAttributeValue={update => {
                                let newAttrVal: AttributeValue[] = Object.assign([], val);
                                newAttrVal[i] = update;
                                updateAttributeValue(newAttrVal);
                            }} />
                        <br />
                    </React.Fragment>
                )}
            </React.Fragment>
        );
    }
}

function buildDefsFromString(defString: string): object {
    let keys: string[] = [];
    let errors: string[] = ['Error'];
    let defs = Object.assign({}, ...defString.split('\n').map((def, i) => {
        if (def) {
            const key = (def.split(':')[0] as string).trim();
            if (key.length < 1) {
                let errMessage = `Line ${i}: Add a key`;
                if (!errors.find(error => error === errMessage)) {
                    errors.push(errMessage);
                }
                return;
            }
            if (keys.find(k => k === key)) {
                let errMessage = `Line ${i}: Duplicate key "${key}"`;
                if (!errors.find(error => error === errMessage)) {
                    errors.push(errMessage);
                }
                return;
            }
            keys.push(key);
            const value = (def.split(':')[1] ?? '' as string).trim();
            return { [key]: value };
        } else {
            return {};
        }
    }));
    if (errors.length > 1) {
        return errors;
    }
    return defs;
}

function buildStringFromDefs(defs: object): string {
    let defString = '';
    Object.keys(defs).forEach(key => {
        if (key) {
            defString += `${key}: `;
            const value = defs[key as keyof typeof defs];
            if (typeof value === 'string' && (value as string).length > 0) {
                defString += value;
            }
            defString += '\n';
        }
    });
    return defString;
}

function buildEntryFromModel(id: string, model: Attribute[]): IEntry {
    let entry = buildEntry(id);
    model.forEach(attribute => {
        entry.attributes[attribute[0]] = buildAttributeValue(attribute[1]);
    });
    return entry;
}

function buildAttributeValue(type: AttributeType): AttributeValue {
    switch (type) {
        case 'string':
            return '';
        case 'number':
            return 0;
        case 'boolean':
            return false;
        default:
            return type.map(type => buildAttributeValue(type));
    }
}

function updateCollectionOnModelChange(collection: ICollection, model: Attribute[]): ICollection {
    let updatedCollection = copyCollection(collection);

    updatedCollection.data = updatedCollection.data.map(entry => updateEntryOnModelChange(entry, model));

    return updatedCollection;
}

function updateEntryOnModelChange(entry: IEntry, model: Attribute[]): IEntry {
    let updatedEntry = buildEntry(entry.id);

    model.forEach(attr => {
        let key = Object.keys(entry.attributes).find(key => key === attr[0]);
        let val = key ? entry.attributes[key] as AttributeValue : '';
        updatedEntry.attributes[attr[0]] = updateAttributeValue(attr[1], val);
    });

    return updatedEntry;
}

function updateAttributeValue(type: AttributeType, val: AttributeValue | null | undefined): AttributeValue {
    switch (type) {
        case 'string':
            if (val) {
                return '' + val;
            }
            return '';
        case 'number':
            if (val && !isNaN(+val)) {
                return +val;
            }
            return 0;
        case 'boolean':
            return !!val;
        default:
            return type.map((type, i) => updateAttributeValue(type, Array.isArray(val) ? val[i] : null));
    }
}

ReactDOM.render(<PkgBuilder />, document.getElementById('app'));