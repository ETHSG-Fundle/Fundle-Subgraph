import { Address, BigInt } from '@graphprotocol/graph-ts';
import { UserStrategyEpochYield } from '../../generated/schema';
import { Deposit as DepositEvent } from '../../generated/ERC4626Strategy/ERC4626Strategy';
import { getUser } from './user';
import { getStrategy } from './strategy';
import { getToken } from './token';

import { ERC4626Strategy } from '../../generated/ERC4626Strategy/ERC4626Strategy';
import { ZERO_BI } from '../utils/constants.template';
import { setSyncingIndex } from '../utils/helper';

export function getUserStrategyEpochYieldEntityId(
  user: string,
  strategyAddress: string,
  epoch: BigInt
): string {
  return `${user}-${strategyAddress}-${epoch}`;
}

export function getSharesFromUnderlyingAsset(
  contractAddress: string,
  underlyingAmount: BigInt
): BigInt {
  let exchangeRate = getExchangeRate(contractAddress);
  return exchangeRate.times(underlyingAmount);
}

export function getExchangeRate(address: string): BigInt {
  let contract = ERC4626Strategy.bind(Address.fromString(address));
  let result = contract.try_exchangeRate();

  if (result.reverted) {
    return ZERO_BI;
  }
  return result.value;
}
