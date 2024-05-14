/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { REHYDRATE, REGISTER } from './constants'

import { StoreEnhancer } from "redux";

export interface PersistState {
  version: number;
  rehydrated: boolean;
}

export type PersistedState = {
  _persist: PersistState;
};

export type PersistMigrate =
  (state: PersistedState, currentVersion: number) => Promise<PersistedState>;

export type StateReconciler<S> =
  (inboundState: any, state: S, reducedState: S, config: PersistConfig<S>) => S;

export interface KeyAccessState {
  [key: string]: object;
}

/**
 * @desc
 * `HSS` means HydratedSubState
 * `ESS` means EndSubState
 * `S` means State
 * `RS` means RawState
 */
export interface PersistConfig<S, RS = any, HSS = any, ESS = any> {
  version?: number;
  storage: Storage<S>;
  key: string;
  /**
   * @deprecated keyPrefix is going to be removed in v6.
   */
  keyPrefix?: string;
  blacklist?: Array<string>;
  whitelist?: Array<string>;
  transforms?: Array<Transform<HSS, ESS, S, RS>>;
  throttle?: number;
  migrate?: PersistMigrate;
  stateReconciler?: false | StateReconciler<S>;
  /**
   * @desc Used for migrations.
   */
  getStoredState?: (config: PersistConfig<S, RS, HSS, ESS>) => Promise<PersistedState>;
  debug?: boolean;
  serialize?: boolean;
  deserialize?: boolean | ((x: any) => any);
  timeout?: number;
  writeFailHandler?: (err: Error) => void;
}

export interface PersistorOptions {
  enhancer?: StoreEnhancer<any>;
  manualPersist?: boolean;
}

export interface Storage<S> {
  getItem<K extends keyof S>(key: K, ...args: Array<unknown>): Promise<S[K] | undefined>;
  setItem<K extends keyof S>(key: K, value: S[K], ...args: Array<unknown>): Promise<void>;
  removeItem<K extends keyof S>(key: K, ...args: Array<unknown>): Promise<void>;
  keys?: Array<string>;
  getAllKeys(cb?: any): Promise<unknown>;
}

export interface WebStorage<S> extends Storage<S> {
  /**
   * @desc Fetches key and returns item in a promise.
   */
  getItem<K extends keyof S>(key: K): Promise<S[K] | undefined>;
  /**
   * @desc Sets value for key and returns item in a promise.
   */
  setItem<K extends keyof S>(key: K, item: S[K]): Promise<void>;
  /**
   * @desc Removes value for key.
   */
  removeItem<K extends keyof S>(key: K): Promise<void>;
}

export interface MigrationManifest<S> {
  [key: string]: (state: S & PersistedState) => S & PersistedState;
}

/**
 * @desc
 * `SS` means SubState
 * `ESS` means EndSubState
 * `S` means State
 */
export type TransformInbound<SS, ESS, S = any> =
  (subState: SS, key: keyof S, state: S) => ESS;

/**
 * @desc
 * `SS` means SubState
 * `HSS` means HydratedSubState
 * `RS` means RawState
 */
export type TransformOutbound<SS, HSS, RS = any> =
  (state: SS, key: keyof RS, rawState: RS) => HSS;

export interface Transform<HSS, ESS, S = any, RS = any> {
  in: TransformInbound<HSS, ESS, S>;
  out: TransformOutbound<ESS, HSS, RS>;
}

export type RehydrateErrorType = any;

export interface RehydrateAction {
  type: typeof REHYDRATE;
  key: string;
  payload?: object | null;
  err?: RehydrateErrorType | null;
}

export interface Persistoid {
  update(state: object): void;
  flush(): Promise<any>;
}

export interface RegisterAction {
  type: typeof REGISTER;
  key: string;
}

export type PersistorAction =
  | RehydrateAction
  | RegisterAction
;

export interface PersistorState {
  registry: Array<string>;
  bootstrapped: boolean;
}

export type PersistorSubscribeCallback = () => any;

/**
 * A persistor is a redux store unto itself, allowing you to purge stored state, flush all
 * pending state serialization and immediately write to disk
 */
export interface Persistor {
  pause(): void;
  persist(): void;
  purge(): Promise<any>;
  flush(): Promise<any>;
  dispatch(action: PersistorAction): PersistorAction;
  getState(): PersistorState;
  subscribe(callback: PersistorSubscribeCallback): () => any;
}
