export enum BuiltInImporter {
    dqtact = 'dqtact',
    dqheroesrocketslime = 'dqheroesrocketslime'
}

export function getImporterName(importer: BuiltInImporter) {
    switch (importer) {
        case BuiltInImporter.dqtact:
            return 'Dragon Quest Tact';
        case BuiltInImporter.dqheroesrocketslime:
            return 'Dragon Quest Heroes: Rocket Slime';
        default:
            console.log(importer); return "";
    }
}