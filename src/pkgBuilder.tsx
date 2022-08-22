import React, { MouseEvent, useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { ICollection, IEntry, IPackageMetadata } from './interfaces/IPackage';

enum ATTR_TYPE {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    ARRAY = 'ARRAY',
}

type Attribute = [string, ATTR_TYPE];

type AttributeValue = [string, any];

const PkgBuilder = () => {
    const [name, setName] = useState<string>('<Name>');
    const [icon, setIcon] = useState<string>('<Icon>');
    const [color, setColor] = useState<string>('#000000');
    const [defs, setDefs] = useState<string>('');

    const [collections, setCollections] = useState<ICollection[]>([]);
    const [displayedCollection, setDisplayedCollection] = useState<number>(0);
    const [models, setModels] = useState<Attribute[][]>([]);
    const [newCollectionName, setNewCollectionName] = useState<string>('');

    const [errorMessage, setErrorMessage] = useState<string>('');

    /* Create a new collection */
    const onNewCollectionCallback = (e: MouseEvent) => {
        e.preventDefault();

        setModels(models => models.concat([[["name", ATTR_TYPE.STRING]]]));

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
            return collections.concat({
                name: name,
                layout: {},
                layoutPreview: {},
                data: []
            });
        });
    };

    /* Update a collection name */
    const updateCollectionName = useCallback((collectionIndex: number, update: string) => {
        setCollections(collections => {
            let updatedCollections: ICollection[] = collections.map(collection => copyCollection(collection));

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
            let id = update.trim();
            let updatedCollections: ICollection[] = collections.map(collection => copyCollection(collection));

            if (collectionIndex >= 0 && collectionIndex < updatedCollections.length) {
                let collectionToUpdate = updatedCollections[collectionIndex];
                if (collectionToUpdate) {
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
    const updateCollectionDataEntryAttributeValue = useCallback((collectionIndex: number, entryIndex: number, update: AttributeValue) => {
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
                                [update[0]]: update[1]
                            };
                        }
                    }
                }
            }

            return updatedCollections;
        });
    }, []);

    /* Update a data model */
    const updateModel = useCallback((collectionIndex: number, attributeIndex: number, update: Attribute) => {
        setModels(models => {
            let updatedModels: Attribute[][] = models.map(model => copyModel(model));
            let error = '';

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
                            error = `Attribute '${update[0]}' already exists`;
                        }
                    }

                    setCollections(collections => {
                        let updatedCollections = collections.map(collection => copyCollection(collection));

                        if (collectionIndex >= 0 && collectionIndex < updatedCollections.length) {
                            updatedCollections[collectionIndex] = updateCollectionOnModelChange(updatedCollections[collectionIndex]!, modelToUpdate!);
                        }

                        return updatedCollections;
                    });
                }
            }

            setErrorMessage(error);
            return updatedModels;
        });
    }, []);

    return (
        <div>
            <PkgDisplay name={name} icon={icon} color={color} defs={defs} collections={collections} />
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
                            <textarea rows={5} cols={50} value={defs} onChange={e => setDefs(e.target.value)} />
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
                <input type='text' value={newCollectionName} onChange={e => { setNewCollectionName(e.target.value); setErrorMessage(''); }} />
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
                updateCollectionDataEntryAttributeValue={(entryIndex: number, update: AttributeValue) => updateCollectionDataEntryAttributeValue(displayedCollection, entryIndex, update)}
                model={models[displayedCollection]}
                updateModel={(attributeIndex: number, update: Attribute) => updateModel(displayedCollection, attributeIndex, update)} />
        </div>
    );
}

interface IPkgDisplayProps extends Omit<IPackageMetadata, 'path' | 'defs'> {
    defs: string,
    collections: ICollection[]
}

const PkgDisplay = (props: IPkgDisplayProps) => {
    const { name, icon, color, defs, collections } = props;

    const metadata: Omit<IPackageMetadata, 'path'> = useMemo(() => {
        return {
            name: name,
            icon: icon,
            color: color,
            defs: Object.assign({}, ...defs.split('\n').map(val => ({ [val.split(': ')[0] as string]: val.split(': ')[1] as string })))
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
    updateCollectionDataEntryAttributeValue: (entryIndex: number, update: AttributeValue) => void,
    model?: Attribute[] | null | undefined,
    updateModel: (attributeIndex: number, update: Attribute) => void
}

const CollectionDisplay = (props: ICollectionDisplayProps) => {
    const { collection, updateCollectionName, updateCollectionDataEntryId, updateCollectionDataEntryAttributeValue: updateCollectionData, model, updateModel } = props;

    if (!collection || !model) { return null; }

    const [tab, setTab] = useState<number>(0);
    const [displayedEntry, setDisplayedEntry] = useState<number>(0);
    const [newEntryName, setNewEntryName] = useState<string>('');

    return (
        <div style={{ border: '1px solid black', padding: '8px', marginTop: '8px', maxHeight: '1500px', overflowY: 'auto' }}>
            <input type='text' value={collection.name} onChange={e => updateCollectionName(e.target.value)} />
            <br />
            <button onClick={() => setTab(0)}>Layout preview</button>
            <button onClick={() => setTab(1)}>Layout</button>
            <button onClick={() => setTab(2)}>Entries</button>
            <br />
            <br />
            {tab === 0 ?
                <React.Fragment>
                    <span>Layout preview: {JSON.stringify(collection.layoutPreview, null, '\t')}</span>
                </React.Fragment>
                : null
            }
            {tab === 1 ?
                <React.Fragment>
                    <span>Layout: {JSON.stringify(collection.layout, null, '\t')}</span>
                </React.Fragment>
                : null
            }
            {tab === 2 ?
                <React.Fragment>
                    <span>Model:</span>
                    <div>
                        {model.map((attribute, i) =>
                            <AttributeDisplay
                                key={i}
                                attr={attribute}
                                updateAttribute={(update: Attribute) => updateModel(i, update)} />
                        )}
                    </div>
                    <button onClick={() => updateModel(model.length, ['attribute', ATTR_TYPE.STRING])}>New attribute</button>
                    <hr />
                    <label>
                        Selected entry:&nbsp;
                        <select style={{ width: '150px', marginRight: '8px' }} value={displayedEntry} onChange={e => setDisplayedEntry(parseInt(e.target.value))}>
                            {collection.data.map((entry, i) => <option key={entry.id} value={i}>{entry.id}</option>)}
                        </select>
                    </label>
                    <label>
                        New entry:&nbsp;
                        <input type='text' value={newEntryName} onChange={e => setNewEntryName(e.target.value)} />
                    </label>
                    <button onClick={() => updateCollectionDataEntryId(collection.data.length, newEntryName)}>New entry</button>
                    <br />
                    <EntryDisplay
                        key={displayedEntry}
                        entry={collection.data[displayedEntry]}
                        model={model}
                        updateEntryId={(update: string) => updateCollectionDataEntryId(displayedEntry, update)}
                        updateAttributeValue={(update: AttributeValue) => updateCollectionData(displayedEntry, update)} />
                </React.Fragment>
                : null
            }
        </div>
    );
}

interface IAttributeDisplayProps {
    attr: Attribute,
    updateAttribute: (update: Attribute) => void
}

const AttributeDisplay = (props: IAttributeDisplayProps) => {
    const { attr, updateAttribute } = props;

    return (
        <div>
            <input type='text' value={attr[0]} onChange={e => updateAttribute([e.target.value, attr[1]])} />
            <select value={attr[1]} onChange={e => updateAttribute([attr[0], e.target.value as ATTR_TYPE])}>
                {Object.keys(ATTR_TYPE).map((attr, i) => <option key={i} value={attr}>{attr.toLowerCase()}</option>)}
            </select>
        </div>
    );
}

interface IEntryDisplayProps {
    entry?: IEntry | null | undefined,
    model: Attribute[],
    updateEntryId: (id: string) => void,
    updateAttributeValue: (update: AttributeValue) => void
}

const EntryDisplay = (props: IEntryDisplayProps) => {
    const { entry, model, updateEntryId, updateAttributeValue } = props;

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
                    <tr key={key}>
                        <AttributeValueDisplay
                            attr={model[i]!}
                            attrVal={[key, entry.attributes[key as keyof typeof entry.attributes]]}
                            updateAttributeValue={(update: AttributeValue) => updateAttributeValue(update)} />
                    </tr>
                )}
            </tbody>
        </table>
    );
}

interface IAttributeValueDisplayProps {
    attr: Attribute,
    attrVal: AttributeValue,
    updateAttributeValue: (update: AttributeValue) => void
}

const AttributeValueDisplay = (props: IAttributeValueDisplayProps) => {
    const { attr, attrVal, updateAttributeValue } = props;

    let value: JSX.Element | null = null;
    switch (attr[1]) {
        case ATTR_TYPE.STRING:
            value = <input type='text' value={attrVal[1]} onChange={e => updateAttributeValue([attrVal[0], e.target.value])} />;
            break;
        case ATTR_TYPE.NUMBER:
            value = <input type='number' value={attrVal[1]} onChange={e => updateAttributeValue([attrVal[0], e.target.value])} />;
            break;
        case ATTR_TYPE.BOOLEAN:
            value = <input type='checkbox' checked={attrVal[1]} onChange={e => updateAttributeValue([attrVal[0], e.target.checked])} />;
            break;
        case ATTR_TYPE.ARRAY:
            value = (
                <React.Fragment>
                    {
                        (attrVal[1] as any[]).map((val, i) =>
                            <input type='text' value={val} onChange={e => {
                                let newVal = Object.assign([], attrVal[1]);
                                newVal[i] = e.target.value;
                                updateAttributeValue([attrVal[0], newVal]);
                            }} />
                        )
                    }
                </React.Fragment>
            );
            break;
    }

    return (
        <React.Fragment>
            <td style={{ width: '100px' }}>
                {`${attrVal[0]}:`}
            </td>
            <td>
                {value}
            </td>
        </React.Fragment>
    );
}

function copyEntry(entry: IEntry): IEntry {
    let copiedEntry: IEntry = {
        id: entry.id,
        attributes: { ...entry.attributes }
    };
    return copiedEntry;
}

function copyCollection(collection: ICollection): ICollection {
    let copiedCollection: ICollection = {
        name: collection.name,
        layout: Object.assign({}, collection.layout),
        layoutPreview: Object.assign({}, collection.layoutPreview),
        data: collection.data.map(entry => copyEntry(entry))
    };
    return copiedCollection;
}

function copyModel(model: Attribute[]): Attribute[] {
    let copiedModel: Attribute[] = Object.assign([], model);
    return copiedModel;
}

function buildEntryFromModel(id: string, model: Attribute[]): IEntry {
    let entry: IEntry = {
        id: id,
        attributes: {}
    }
    model.forEach(attribute => {
        switch (attribute[1]) {
            case ATTR_TYPE.STRING:
                entry.attributes = {
                    ...entry.attributes,
                    [attribute[0]]: ''
                };
                break;
            case ATTR_TYPE.NUMBER:
                entry.attributes = {
                    ...entry.attributes,
                    [attribute[0]]: 0
                };
                break;
            case ATTR_TYPE.BOOLEAN:
                entry.attributes = {
                    ...entry.attributes,
                    [attribute[0]]: false
                };
                break;
            case ATTR_TYPE.ARRAY:
                entry.attributes = {
                    ...entry.attributes,
                    [attribute[0]]: []
                };
                break;
        }
    });
    return entry;
}

function updateCollectionOnModelChange(collection: ICollection, model: Attribute[]): ICollection {
    let updatedCollection = copyCollection(collection);

    updatedCollection.data = updatedCollection.data.map(entry => updateEntryAttributesOnModelChange(entry, model));

    return updatedCollection;
}

function updateEntryAttributesOnModelChange(entry: IEntry, model: Attribute[]): IEntry {
    let updatedEntry: IEntry = {
        id: entry.id,
        attributes: {}
    };

    model.forEach(attr => {
        let key = Object.keys(entry.attributes).find(key => key === attr[0]);
        let val = entry.attributes[key as keyof typeof entry.attributes] as any;
        switch (attr[1]) {
            case ATTR_TYPE.STRING:
                if (typeof val !== 'string') {
                    val = (val ? '' + val : '');
                }
                break;
            case ATTR_TYPE.NUMBER:
                if (typeof val !== 'number') {
                    val = isNaN(+val) ? 0 : +val;
                }
                break;
            case ATTR_TYPE.BOOLEAN:
                if (typeof val !== 'boolean') {
                    val = !!val;
                }
                break;
            case ATTR_TYPE.ARRAY:
                if (!Array.isArray(val)) {
                    val = [];
                }
                break;
        }
        updatedEntry.attributes = {
            ...updatedEntry.attributes,
            [attr[0]]: val
        };
    });

    return updatedEntry;
}

ReactDOM.render(<PkgBuilder />, document.getElementById('app'));