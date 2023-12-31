import { BigDecimal, BigInt, Entity, Value, ethereum } from '@graphprotocol/graph-ts';
import { Bundle } from '../../generated/schema';
import { ZERO_BI, ONE_BI, IPFS_HASH_LENGTH, NATIVE_ALT } from './constants.template';
import { NATIVE } from './constants';

/* ==================================================
                    Constants
=====================================================*/

/* ==================================================
        Miscellaneous Helper Functions
=====================================================*/
export function abs(number: BigInt): BigInt {
  if (number.lt(ZERO_BI)) {
    number = ZERO_BI.minus(number);
  }
  return number;
}

export function max(a: BigInt, b: BigInt): BigInt {
  if (a.ge(b)) return a;
  return b;
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1');
  for (let i = ZERO_BI; i.gt(decimals as BigInt); i = i.minus(ONE_BI)) {
    bd = bd.div(BigDecimal.fromString('10'));
  }

  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'));
  }
  return bd;
}

export function toDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  return amount.toBigDecimal().div(exponentToBigDecimal(decimals));
}

export function safeDiv(x: BigInt, y: BigInt): BigInt {
  if (x === ZERO_BI || y === ZERO_BI) return ZERO_BI;

  return x.div(y);
}

/* ==================================================
           IPFS related Helper Functions
=====================================================*/

export function processUriStringForIpfs(uri: string): string {
  if (uri.length !== 79) uri = uri.slice(1, -1);

  return getTokenIpfsHash(uri);
}
/* ==================================================
            Artzone Token Related Functions
=====================================================*/
export function getTokenIpfsHash(tokenUri: string): string {
  return tokenUri.slice(-IPFS_HASH_LENGTH);
}

export function getTokenEntityId(
  chainId: string,
  contractAddress: string,
  tokenId: BigInt
): string {
  return `${chainId}-${contractAddress}-${tokenId}`;
}

export function getTransferId(hash: string, logIndex: BigInt, tokenId: BigInt): string {
  return `${hash}-${logIndex}-${tokenId}`;
}

/* ==================================================
            Syncing Index Related
=====================================================*/

export function getNextSyncingIndex(collection: string): BigInt {
  let bundle = Bundle.load(collection);
  if (!bundle) {
    bundle = new Bundle(collection);
    bundle.syncingIndex = BigInt.fromI32(0);
  }

  let newSyncingIndex = bundle.syncingIndex.plus(ONE_BI);
  bundle.syncingIndex = newSyncingIndex;
  bundle.save();

  return newSyncingIndex;
}

export function setSyncingIndex(collection: string, entity: Entity): void {
  let syncingIndex = getNextSyncingIndex(collection);
  entity.set('syncingIndex', Value.fromBigInt(syncingIndex));
}

/* ==================================================
        Transaction Related Helper Functions
=====================================================*/

export function generateTransactionId(event: ethereum.Event): string {
  let blockHash = event.block.hash.toHexString();
  let txHash = event.transaction.hash.toHexString();
  let logIndex = event.logIndex.toString();
  return blockHash + '-' + txHash + '-' + logIndex;
}

/**
 * Set all metadata for an entity such as block number, timestamp.
 */
export function setMetaDataFields(entity: Entity, event: ethereum.Event): void {
  entity.set('txHash', Value.fromString(event.transaction.hash.toHexString()));
  entity.set('blockHash', Value.fromString(event.block.hash.toHexString()));
  entity.set('blockNumber', Value.fromBigInt(event.block.number));
  entity.set('timestamp', Value.fromBigInt(event.block.timestamp));
}

export function checkNullAddress(address: string): boolean {
  return address === NATIVE || address === NATIVE_ALT;
}

/* ==================================================
                Lossless Strategy Related
=====================================================*/
export function getStrategyName(address: string): string {
  address = address.toLowerCase();
  return 'UNKNOWN';
}

export function getAmountByProportion(
  amount: BigInt,
  relativeAmount: BigInt,
  relativeTotal: BigInt
): BigInt {
  return amount.times(safeDiv(relativeAmount, relativeTotal));
}
