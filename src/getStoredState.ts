/* eslint-disable @typescript-eslint/no-explicit-any */
import type { KeyAccessState, PersistConfig, State, ExactKeys, Deserialize } from './types'

import { KEY_PREFIX } from './constants'

// S is the redux reducers/redux state
// RS is the raw state stored in the storage
export default function getStoredState<S extends {[key: string]: object}, RS extends {[K in keyof S]: object} & ExactKeys<S, RS>>(
  config: PersistConfig<S, RS>
): Promise<State<S> | void> {
  const transforms = config.transforms || []
  const storageKey: keyof KeyAccessState<RS> = `${
    config.keyPrefix !== undefined ? config.keyPrefix : KEY_PREFIX
  }${config.key}`
  const storage = config.storage
  const debug = config.debug
  let deserialize: Deserialize<RS>
  if (config.deserialize) {
    deserialize = config.deserialize
  } else {
    deserialize = defaultDeserialize
  }
  return storage.getItem(storageKey).then((serialized: Parameters<Deserialize<RS>> | undefined) => { // TODO: Change unknown to Parameters of dezerialize
    if (!serialized) return undefined
    else {
      try {
        const rawState = deserialize(serialized);
        let state: State<S> = transforms.reduceRight((subState, transformer) => {
            (Object.keys(rawState) as Array<keyof State<S>>).forEach(key => {
                subState[key] = transformer.out(subState[key], key, rawState)
            })
            return subState
        }, rawState)
        // (Object.keys(rawState) as Array<keyof State<S>>).forEach(key => { // Why is the transforms applied to one key at a time? They should transform the whole state so you have predictable states between transformers
        //   state[key] = transforms.reduceRight((subState, transformer) => {
        //     return transformer.out(subState, key, rawState)
        //   }, deserialize(rawState[key])) // Why is rawstate being deserialized again?
        // })
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
