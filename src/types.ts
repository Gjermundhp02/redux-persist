/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { REHYDRATE, REGISTER } from './constants'

import { StoreEnhancer } from "redux";

export type ExactKeys<T, U> = {
    [K in keyof U]: K extends keyof T ? unknown : never;
};
export interface PersistState {
    version: number;
    rehydrated: boolean;
}

export type PersistedState = {
  _persist: PersistState;
};

export type State<S> = {
    [K in keyof S]: S[K]&PersistedState;
}

export type Deserialize<S> = (x: any) => State<S>; // TODO: Add generic for argument type

export type Serialize<S> = (x: State<S>) => any; // TODO: Add generic for return type

export type PersistMigrate<S> =
  (state: State<S>, currentVersion: number) => Promise<State<S>>;

export type StateReconciler<S, RS> =
  (inboundState: any, state: S, reducedState: S, config: PersistConfig<S, RS>) => S;

// S is the reudx reducers/redux state
export interface KeyAccessState<S> {
  [key: string]: State<S>;
}

// {
//     version: { // The version of the store, one per version. Eg. if current version is 2, then 0, 1, 2 needs to be defined
//         key: {// A key that defines the spesific store
//             reducer-states: {
                
//             }
//         } 
//         _persist: number // Not added by the user
//     }
// }

/**
 * @desc
 * `S` means State, the state redux uses
 * `RS` means RawState, the state stored in the storage
 */
export interface PersistConfig<S extends { [key: string]: object }, RS extends ExactKeys<S, RS>> {
  version?: number;
  storage: Storage<RS>;
  key: string;
  /**
   * @deprecated keyPrefix is going to be removed in v6.
   */
  keyPrefix?: string;
  blacklist?: Array<string>;
  whitelist?: Array<string>;
  transforms?: Array<Transform<any, any>>; // Unknown because the transfoms use different types
  throttle?: number;
  migrate?: PersistMigrate<S>; // What happens when it has to transform and migrate. The way to transform it in the last version might not work in the new version
  stateReconciler?: false | StateReconciler<S, RS>;
  /**
   * @desc Used for migrations.
   */
  getStoredState?: (config: PersistConfig<S, RS>) => Promise<State<S> | void>; // Does not take into accont migration/versioned states
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

export interface Storage<RS> {
  getItem<K extends keyof KeyAccessState<RS>>(key: K, ...args: Array<unknown>): Promise<ReturnType<Serialize<RS>> | undefined>;
  setItem<K extends keyof ReturnType<Serialize<RS>>>(key: K, value: ReturnType<Serialize<RS>>, ...args: Array<unknown>): Promise<void>;
  removeItem<K extends keyof RS>(key: K, ...args: Array<unknown>): Promise<void>;
  keys?: Array<string>;
  getAllKeys(cb?: any): Promise<unknown>;
}

export interface WebStorage<RS> extends Storage<RS> {
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
  [key: string]: (state: State<S>) => State<S>;
}

/**
 * @desc
 * `S` means State, the state redux uses
 * `RS` means RawState, the state stored in the storage	
 */
export type TransformInbound<S extends { [key: string]: object }, RS extends ExactKeys<S, RS>> =
  (subState: State<S>[keyof S], key?: keyof S, state?: S) => State<RS>[Extract<keyof RS, keyof S>];

export type TransformOutbound<S extends { [key: string]: object }, RS extends ExactKeys<S, RS>> =
  (subState: State<RS>[keyof RS], key?: keyof RS, rawState?: State<RS>) => State<S>[Extract<keyof S, keyof RS>];


export interface Transform<S extends {[key: string]: object}, RS extends {[K in keyof S]: object} & ExactKeys<S, RS>> {
  in: TransformInbound<S, RS>;
  out: TransformOutbound<S, RS>;
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
