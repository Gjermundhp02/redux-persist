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

export type State<S = {[key: string]: object}> = {
    [K in keyof S]: S[K]&PersistedState;
}

export type PersistMigrate =
  (state: PersistedState, currentVersion: number) => Promise<PersistedState>;

export type StateReconciler<S> =
  (inboundState: any, state: S, reducedState: S, config: PersistConfig<S>) => S;

// S is the reudx reducers/redux state
export interface KeyAccessState<S> {
  [key: string]: State<S>;
}

// {
//     key: {
//         reducer-states: {
//             _persist
//             reducer:keys
//         }
//     } // A key that defines the spesific store

// }

/**
 * @desc
 * `S` means State, the state redux uses
 * `RS` means RawState, the state stored in the storage
 */
export interface PersistConfig<S = {[key: string]: object}, RS = {[K in keyof S]: object}> {
  version?: number;
  storage: Storage<S, RS>;
  key: string;
  /**
   * @deprecated keyPrefix is going to be removed in v6.
   */
  keyPrefix?: string;
  blacklist?: Array<string>;
  whitelist?: Array<string>;
  transforms?: Array<Transform<S, RS>>;
  throttle?: number;
  migrate?: PersistMigrate;
  stateReconciler?: false | StateReconciler<S>;
  /**
   * @desc Used for migrations.
   */
  getStoredState?: (config: PersistConfig<S, RS>) => Promise<State<S>>;
  debug?: boolean;
  serialize?: ((x: State<RS>) => any);
  deserialize?: ((x: any) => State<RS>);
  timeout?: number;
  writeFailHandler?: (err: Error) => void;
}

export interface PersistorOptions {
  enhancer?: StoreEnhancer<any>;
  manualPersist?: boolean;
}

export interface Storage<S, RS> {
  getItem<K extends keyof KeyAccessState<RS>>(key: K, ...args: Array<unknown>): Promise<KeyAccessState<RS>[K] | undefined>;
  setItem<K extends keyof KeyAccessState<S>>(key: K, value: KeyAccessState<S>[K], ...args: Array<unknown>): Promise<void>;
  removeItem<K extends keyof RS>(key: K, ...args: Array<unknown>): Promise<void>;
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
 * From storage to state
 * `SS` means SubState
 * `HSS` means HydratedSubState
 * `RS` means RawState
 */
export type TransformOutbound<S extends {[key: string]: extendsobject}, RS = {[K in keyof S]: object}> =
  (state: State<RS>, key: keyof RS, rawState: State<RS>) => State<S>[keyof RS];

const r: TransformOutbound = (state, key, rawState) => {
    return state[key];
}
r({a: {_persist: {version: 1, rehydrated: true}, theme: {das: 2 }}, b: {_persist: {version: 1, rehydrated: true}}}, 'a', {a: {_persist: {version: 1, rehydrated: true}}, b: {_persist: {version: 1, rehydrated: true}}})
export interface Transform<S = {[key: string]: object}, RS = {[K in keyof S]: object}> {
  in: TransformInbound<S>;
  out: TransformOutbound<S, RS>;
}

type l = "noe" | "noe2" extends string? true: false;

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
