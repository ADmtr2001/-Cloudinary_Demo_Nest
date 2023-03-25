import { Resource } from './resource.interface';

export interface GetImagesResponse {
  resources: Resource[];
  next_cursor: string;
}
