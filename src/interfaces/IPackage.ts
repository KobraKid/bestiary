import { ILayoutElement } from './ILayout';

export default interface IPackage {
  metadata: IPackageMetadata,
  data: IPackageData[],
  layout: ILayoutElement,
  layoutPreview: ILayoutElement,
}

export interface IPackageMetadata {
  name: string,
  path: string,
  icon: string,
}

export interface IPackageData {
  id: string,
  data: any,
}
