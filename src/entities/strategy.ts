import { Address, BigInt } from '@graphprotocol/graph-ts';

import { Strategy } from '../../generated/schema';
import { getStrategyName } from '../utils/helper';
import { setSyncingIndex } from '../utils/helper';

export function getStrategy(contractAddress: string): Strategy {
  let strategy = Strategy.load(contractAddress);

  if (!strategy) {
    strategy = new Strategy(contractAddress);
    strategy.name = getStrategyName(contractAddress);
    setSyncingIndex('strategy', strategy);

    strategy.save();
  }

  return strategy;
}

/* ==================================================
            Helper/Intermediate Functions
=====================================================*/
