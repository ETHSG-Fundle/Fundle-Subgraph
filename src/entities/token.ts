import { Address, BigInt } from '@graphprotocol/graph-ts';
// Schemas:
import { Token } from '../../generated/schema';

import { ERC20 } from '../../generated/BeneficiaryDonationManager/ERC20';

// Constants/Helper:
import { getTokenEntityId, setSyncingIndex } from '../utils/helper';
import { ERC20_INTERFACE_ID } from '../utils/constants';
import { NATIVE, NATIVE_ALT } from '../utils/constants.template';

/* ==================================================
                    Main Function
=====================================================*/

// Artzone Token -> ID = chainId-address-tokenId
export function getToken(contractAddress: string): Token {
  let token = Token.load(contractAddress);

  if (!token) {
    token = new Token(contractAddress);
    token.type = getType(contractAddress);
    token.name = getName(contractAddress);
    token.symbol = getSymbol(contractAddress);

    // Set metadata of token:

    setSyncingIndex('tokens', token);
  }

  token.save();

  return token;
}

/* ==================================================
            Helper/Intermediate Functions
=====================================================*/

export function getType(address: string): string {
  if (address == NATIVE || address == NATIVE_ALT) {
    return 'NATIVE';
  }

    return 'ERC20';
}

// Metadata helper functions:
export function getName(address: string): string {
  let contract = ERC20.bind(Address.fromString(address));
  const result = contract.try_name();

  if (result.reverted) {
    return 'unknown';
  }
  return result.value;
}

export function getSymbol(address: string): string {
  let contract = ERC20.bind(Address.fromString(address));
  const result = contract.try_symbol();

  if (result.reverted) {
    return 'unknown';
  }
  return result.value;
}

