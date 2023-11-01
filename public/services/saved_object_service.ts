/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { SavedObjectsClientContract } from '../../../../src/core/public';

export class SavedObjectService<T extends {}> {
  private objects: Record<string, BehaviorSubject<Partial<T> | null>> = {};
  private loadingStatus: Record<string, BehaviorSubject<boolean>> = {};

  constructor(
    private readonly client: SavedObjectsClientContract,
    private readonly savedObjectType: string
  ) {}

  private setLoading(id: string, loading: boolean) {
    if (!this.loadingStatus[id]) {
      this.loadingStatus[id] = new BehaviorSubject(loading);
    } else {
      this.loadingStatus[id].next(loading);
    }
  }

  private async load(id: string) {
    // set loading to true
    this.setLoading(id, true);

    const savedObject = await this.client.get<Partial<T>>(this.savedObjectType, id);

    // set loading to false
    this.setLoading(id, false);

    if (!savedObject.error) {
      this.objects[id].next(savedObject.attributes);
    }
    return savedObject;
  }

  private async create(id: string, attributes: Partial<T>) {
    this.setLoading(id, true);
    const newObject = await this.client.create<Partial<T>>(this.savedObjectType, attributes, {
      id,
    });
    this.objects[id].next({ ...newObject.attributes });
    this.setLoading(id, false);
    return newObject.attributes;
  }

  private async update(id: string, attributes: Partial<T>) {
    this.setLoading(id, true);
    const newObject = await this.client.update<Partial<T>>(this.savedObjectType, id, attributes);
    this.objects[id].next({ ...newObject.attributes });
    this.setLoading(id, false);
    return newObject.attributes;
  }

  private async initialize(id: string) {
    if (!this.objects[id]) {
      this.objects[id] = new BehaviorSubject<Partial<T> | null>(null);
      await this.load(id);
    }
  }

  public async get(id: string) {
    await this.initialize(id);
    return this.objects[id].getValue();
  }

  public get$(id: string) {
    this.initialize(id);
    return this.objects[id];
  }

  public getLoadingStatus$(id: string) {
    return this.loadingStatus[id];
  }

  public async createOrUpdate(id: string, attributes: Partial<T>) {
    const currentObject = await this.load(id);

    if (currentObject.error) {
      // Object not found, create a new object
      if (currentObject.error.statusCode === 404) {
        return await this.create(id, attributes);
      }
    } else {
      // object found, update existing object
      return await this.update(id, attributes);
    }
  }
}
