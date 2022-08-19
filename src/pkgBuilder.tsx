import React, { MouseEvent, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import IPackage, { ICollection, IPackageMetadata } from './interfaces/IPackage';

const PkgBuilder = () => {
    const [name, setName] = useState<string>('<Name>');
    const [icon, setIcon] = useState<string>('<Icon>');
    const [color, setColor] = useState<string>('#000000');
    const [defs, setDefs] = useState<string>('');

    const [collections, setCollections] = useState<ICollection[]>([]);
    const [newCollectionName, setNewCollectionName] = useState<string>('');

    const onNewCollectionCallback = (e: MouseEvent) => {
        e.preventDefault();
        setCollections(collections => {
            if (newCollectionName.length < 1 || collections.find(collection => collection.name === newCollectionName)) {
                // a collection of this name already exists, don't make any changes
                return collections;
            }
            return collections.concat({
                name: newCollectionName,
                layout: {},
                layoutPreview: {},
                data: []
            });
        })
    };

    return (
        <div>
            <PkgDisplay name={name} icon={icon} color={color} defs={defs} collections={collections} />
            <form onSubmit={e => e.preventDefault()}>
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
                    New collection:&nbsp;
                    <input type='text' value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} />
                </label>
                <button onClick={onNewCollectionCallback}>Add Collection</button>
                <br />
                <CollectionDisplay collections={collections} />
            </form>
        </div>
    );
}

interface IPkgDisplayProps extends Omit<IPackageMetadata, 'path' | 'defs'> {
    defs: string,
    collections: ICollection[]
}

const PkgDisplay = (props: IPkgDisplayProps) => {
    const { name, icon, color, defs, collections } = props;

    const metadata: IPackageMetadata = useMemo(() => {
        return {
            name: name,
            path: '',
            icon: icon,
            color: color,
            defs: Object.assign({}, ...defs.split('\n').map(val => ({ [val.split(': ')[0] as string]: val.split(': ')[1] as string })))
        }
    }, [name, icon, color, defs]);

    const pkg: IPackage = useMemo(() => {
        return {
            metadata: metadata,
            collections: collections
        }
    }, [metadata, collections]);

    return (
        <React.Fragment>
            <div>
                <textarea rows={10} cols={100} readOnly value={JSON.stringify(pkg ?? {}, null, '\t')} />
            </div>
        </React.Fragment>
    );
}

interface ICollectionDisplayProps {
    collections: ICollection[]
}

const CollectionDisplay = (props: ICollectionDisplayProps) => {
    const { collections } = props;
    return (
        <ul>
            {collections.map(collection =>
                <li key={collection.name}>
                    <span>{collection.name}</span>
                    <br />
                    <span>Layout: {JSON.stringify(collection.layout, null, '\t')}</span>
                    <br />
                    <span>Layout preview: {JSON.stringify(collection.layoutPreview, null, '\t')}</span>
                    <br />
                    <span>Data: {JSON.stringify(collection.data, null, '\t')}</span>
                    <br />
                    <button>Remove</button>
                </li>)
            }
        </ul>
    );
}

ReactDOM.render(<PkgBuilder />, document.getElementById('app'));