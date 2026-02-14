import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';

const WS_PROVIDER = 'wss://ws-archive.lunes.io';

let api: ApiPromise | null = null;

export async function getApi(): Promise<ApiPromise> {
  if (!api) {
    const provider = new WsProvider(WS_PROVIDER);
    api = await ApiPromise.create({ provider });
  }
  return api;
}

export async function disconnectApi(): Promise<void> {
  if (api) {
    await api.disconnect();
    api = null;
  }
}

// Staking Functions
export async function bond(
  controllerAddress: string,
  amount: bigint,
  payee: 'Staked' | 'Stash' | 'Controller' = 'Staked'
): Promise<string> {
  const api = await getApi();
  const injector = await web3FromAddress(controllerAddress);
  
  const tx = api.tx.staking.bond(
    controllerAddress,
    amount,
    payee
  );
  
  return new Promise((resolve, reject) => {
    tx.signAndSend(
      controllerAddress,
      { signer: injector.signer },
      ({ status, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isInBlock) {
          resolve(status.asInBlock.toHex());
        }
      }
    ).catch(reject);
  });
}

export async function bondExtra(
  stashAddress: string,
  maxAdditional: bigint
): Promise<string> {
  const api = await getApi();
  const injector = await web3FromAddress(stashAddress);
  
  const tx = api.tx.staking.bondExtra(maxAdditional);
  
  return new Promise((resolve, reject) => {
    tx.signAndSend(
      stashAddress,
      { signer: injector.signer },
      ({ status, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isInBlock) {
          resolve(status.asInBlock.toHex());
        }
      }
    ).catch(reject);
  });
}

export async function unbond(
  stashAddress: string,
  value: bigint
): Promise<string> {
  const api = await getApi();
  const injector = await web3FromAddress(stashAddress);
  
  const tx = api.tx.staking.unbond(value);
  
  return new Promise((resolve, reject) => {
    tx.signAndSend(
      stashAddress,
      { signer: injector.signer },
      ({ status, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isInBlock) {
          resolve(status.asInBlock.toHex());
        }
      }
    ).catch(reject);
  });
}

export async function withdrawUnbonded(
  stashAddress: string
): Promise<string> {
  const api = await getApi();
  const injector = await web3FromAddress(stashAddress);
  
  const tx = api.tx.staking.withdrawUnbonded(0); // numSlashingSpans = 0
  
  return new Promise((resolve, reject) => {
    tx.signAndSend(
      stashAddress,
      { signer: injector.signer },
      ({ status, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isInBlock) {
          resolve(status.asInBlock.toHex());
        }
      }
    ).catch(reject);
  });
}

export async function nominate(
  controllerAddress: string,
  targets: string[]
): Promise<string> {
  const api = await getApi();
  const injector = await web3FromAddress(controllerAddress);
  
  const tx = api.tx.staking.nominate(targets);
  
  return new Promise((resolve, reject) => {
    tx.signAndSend(
      controllerAddress,
      { signer: injector.signer },
      ({ status, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isInBlock) {
          resolve(status.asInBlock.toHex());
        }
      }
    ).catch(reject);
  });
}

export async function chill(controllerAddress: string): Promise<string> {
  const api = await getApi();
  const injector = await web3FromAddress(controllerAddress);
  
  const tx = api.tx.staking.chill();
  
  return new Promise((resolve, reject) => {
    tx.signAndSend(
      controllerAddress,
      { signer: injector.signer },
      ({ status, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isInBlock) {
          resolve(status.asInBlock.toHex());
        }
      }
    ).catch(reject);
  });
}

// Query Functions
export async function getStakingInfo(address: string): Promise<{
  ledger: any;
  nominators: any;
  bonded: string | null;
}> {
  const api = await getApi();
  
  const [ledger, nominators, bonded] = await Promise.all([
    api.query.staking.ledger(address),
    api.query.staking.nominators(address),
    api.query.staking.bonded(address),
  ]);
  
  return {
    ledger: ledger.toHuman(),
    nominators: nominators.toHuman(),
    bonded: bonded.toString(),
  };
}

export async function getActiveEra(): Promise<number> {
  const api = await getApi();
  const era = await api.query.staking.activeEra();
  return era.toJSON()?.index || 0;
}

export async function getErasRewardPoints(era: number): Promise<any> {
  const api = await getApi();
  const points = await api.query.staking.erasRewardPoints(era);
  return points.toHuman();
}

export async function getValidators(): Promise<string[]> {
  const api = await getApi();
  const validators = await api.query.staking.validators.keys();
  return validators.map((key) => key.args[0].toString());
}

export async function getValidatorInfo(validatorAddress: string): Promise<{
  validatorPrefs: any;
  exposure: any;
}> {
  const api = await getApi();
  
  const [validatorPrefs, exposure] = await Promise.all([
    api.query.staking.validators(validatorAddress),
    api.query.staking.erasStakers(await getActiveEra(), validatorAddress),
  ]);
  
  return {
    validatorPrefs: validatorPrefs.toHuman(),
    exposure: exposure.toHuman(),
  };
}
