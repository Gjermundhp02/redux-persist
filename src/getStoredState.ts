/* eslint-disable @typescript-eslint/no-explicit-any */
import type { KeyAccessState, PersistConfig, State } from './types'

import { KEY_PREFIX } from './constants'

// S is the redux reducers/redux state
// RS is the raw state stored in the storage
export default function getStoredState<S extends {[key: string]: object}, RS extends {[K in keyof S]: object}>(
  config: PersistConfig<S, RS>
): Promise<State<S> | void> {
  const transforms = config.transforms || []
  const storageKey: keyof KeyAccessState<RS> = `${
    config.keyPrefix !== undefined ? config.keyPrefix : KEY_PREFIX
  }${config.key}`
  const storage = config.storage
  const debug = config.debug
  let deserialize: (x: any) => State<RS>
  if (config.deserialize) {
    deserialize = config.deserialize
  } else {
    deserialize = defaultDeserialize
  }
  return storage.getItem(storageKey).then((serialized: KeyAccessState<RS>[keyof KeyAccessState<RS>] | undefined) => {
    if (!serialized) return undefined
    else {
      try {
        let state: State<S> = {} as State<S>;
        const rawState = deserialize(serialized)
        Object.keys(rawState).forEach(key => {
          state[key] = transforms.reduceRight((subState, transformer) => {
            return transformer.out(subState, key, rawState)
          }, deserialize(rawState[key])) // Why is rawstate being deserialized again?
        })
        return state
      } catch (err) {
        if (process.env.NODE_ENV !== 'production' && debug)
          console.log(
            `redux-persist/getStoredState: Error restoring data ${serialized}`,
            err
          )
        throw err
      }
    }
  })
}

function defaultDeserialize(serial: string) {
  return JSON.parse(serial)
}
