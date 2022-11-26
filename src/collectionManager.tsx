import React, { useCallback, useEffect, useState } from "react";
import { getValueOrLiteral } from "./layout/base";
import ICollection from "./model/Collection";
import { ICollectionConfig } from "./model/Config";
import IPackage from "./model/Package";
import './styles/collectionManager.scss';

type Toggle = [key: string, toggled: boolean]

export interface ICollectionManagerProps {
    pkg: IPackage | null,
    collection: ICollection | null,
    show: boolean,
    onAccept: () => void,
    onCancel: () => void
}

export const CollectionManager = (props: ICollectionManagerProps) => {
    const { pkg, collection, show, onAccept, onCancel } = props;
    const [configs, setConfigs] = useState<ICollectionConfig[] | null>(null);
    const [selectedConfig, setSelecetdConfig] = useState<ICollectionConfig | null>(null);
    const [categories, setCategories] = useState<Toggle[]>([]);
    const [spoilers, setSpoilers] = useState<Toggle[]>([]);

    const onAddCollection = useCallback(() => {
        setConfigs(config => {
            return config ? config.concat([{
                name: 'New collection ' + (config.length + 1),
                id: '' + Math.random(),
                color: '#000000',
                categories: [],
                spoilers: []
            }]) : null;
        });
    }, [setConfigs]);

    const onSelectConfig = useCallback((config: ICollectionConfig, currentConfig: ICollectionConfig | null) => {
        if (config.id === currentConfig?.id) { return; }
        currentConfig && setConfigs(configs => configs?.map(c => c.id === currentConfig.id ? currentConfig : c) ?? null);
        setSelecetdConfig(config);
    }, []);

    const onUpdateCategory = useCallback((category: string) => {
        setCategories(categories => {
            const newCategories: Toggle[] = categories.map(c => [c[0], c[0] === category ? !c[1] : c[1]]);
            setSelecetdConfig(config => {
                return config ? {
                    name: config.name,
                    id: config.id,
                    color: config.color,
                    categories: newCategories.filter(c => c[1]).map(c => c[0] as string),
                    spoilers: config.spoilers
                } : null;
            });
            return newCategories;
        });
    }, []);

    const onUpdateSpoilers = useCallback((spoiler: string) => {
        setSpoilers(spoilers => {
            const newSpoilers: Toggle[] = spoilers.map(s => [s[0], s[0] === spoiler ? !s[1] : s[1]]);
            setSelecetdConfig(config => {
                return config ? {
                    name: config.name,
                    id: config.id,
                    color: config.color,
                    categories: config.categories,
                    spoilers: newSpoilers.filter(s => s[1]).map(s => s[0] as string)
                } : null;
            });
            return newSpoilers;
        })
    }, []);

    const onSaveConfig = useCallback((currentConfig: ICollectionConfig | null) => {
        setConfigs(configs => {
            const updatedConfigs = configs?.map(c => c.id === currentConfig?.id ? currentConfig : c) ?? null;
            if (pkg && collection && updatedConfigs) {
                window.config.saveConfig(pkg, collection.name, updatedConfigs);
            }
            return updatedConfigs;
        });
        onAccept();
    }, [onAccept]);

    useEffect(() => {
        if (pkg && collection) {
            window.config.loadConfig(pkg, collection.name).then(config => {
                setSelecetdConfig(null);
                setConfigs(config);
            });

            const categorySet = new Set<string>(['']);
            const attributeSet = new Set<string>();
            collection.data.forEach(entry => {
                (entry.category && entry.category.length > 0) && categorySet.add(getValueOrLiteral({ pkg: pkg }, entry.category).toString());
                Object.keys(entry.attributes).forEach(key => attributeSet.add(key))
            });
            setCategories(Array.from(categorySet).map(cat => [cat, true]));
            setSpoilers(Array.from(attributeSet).map(attr => [attr, false]));
        }
    }, [pkg, collection, show]);

    useEffect(() => {
        setCategories(categories => {
            return categories.map(c => [c[0], selectedConfig?.categories.find(selectedCategory => c[0] === selectedCategory) !== undefined ?? false]);
        });
        setSpoilers(spoilers => {
            return spoilers.map(s => [s[0], selectedConfig?.spoilers.find(selectedSpoiler => s[0] === selectedSpoiler) !== undefined ?? false]);
        });
    }, [selectedConfig]);

    return ((show && collection) ?
        <div className='manager-shield' onClick={onCancel}>
            <div className='manager' onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
                <div className='manager-title'>{collection.name} [{collection.data.length} entries]</div>
                <div className='manager-content'>
                    <div>
                        <div>
                            <button onClick={onAddCollection}>{'\u2795'}</button>
                            <div>Collection</div>
                        </div>
                        <div className='config-container'>
                            <ul>
                                {configs?.map(config =>
                                    <li key={config.id} className={config.id === selectedConfig?.id ? 'selected-config' : ''} onClick={() => onSelectConfig(config, selectedConfig)}>
                                        {config.name}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                    {selectedConfig &&
                        <React.Fragment>
                            <Categories configId={selectedConfig.id} categories={categories} onUpdateCategory={onUpdateCategory} />
                            <Spoilers configId={selectedConfig.id} spoilers={spoilers} onUpdateSpoiler={onUpdateSpoilers} />
                        </React.Fragment>
                    }
                </div>
                <div className='manager-buttons'>
                    <button onClick={() => onSaveConfig(selectedConfig)}>Accept</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
        : null
    );
}

interface ICategoryProps {
    configId: string,
    categories: Toggle[],
    onUpdateCategory: (category: string) => void
}

const Categories = (props: ICategoryProps) => {
    const { configId, categories, onUpdateCategory } = props;

    return (
        <div>
            Apply to categories
            <div className='category-container'>
                <ul>
                    {categories.map(category =>
                        <li key={configId + category[0]}>
                            <input type='checkbox' checked={category[1]} onChange={() => onUpdateCategory(category[0])} />
                            {category[0] === '' ? '<no category>' : category[0]}
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}

interface ISpoilerProps {
    configId: string,
    spoilers: Toggle[],
    onUpdateSpoiler: (spoiler: string) => void
}

const Spoilers = (props: ISpoilerProps) => {
    const { configId, spoilers, onUpdateSpoiler } = props;

    return (
        <div>
            Mark as spoiler
            <div className='spoiler-container'>
                <ul>
                    {spoilers.map(spoiler =>
                        <li key={configId + spoiler[0]}>
                            <input type='checkbox' checked={spoiler[1]} onChange={() => onUpdateSpoiler(spoiler[0])} />
                            {spoiler[0]}
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}