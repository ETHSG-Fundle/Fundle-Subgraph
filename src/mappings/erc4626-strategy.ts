import {
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  EpochYieldClaim as EpochYieldClaimEvent,
  Transfer as TransferEvent,
  DistributeYield as DistributeYieldEvent,
} from '../../generated/SDAIERC4626Strategy/ERC4626Strategy';
import {
  BeneficiaryYieldDistribution,
  YieldClaim,
  UserStrategyEpochYield,
} from '../../generated/schema';
import { getBeneficiary } from '../entities/beneficiary';
import { getStrategy } from '../entities/strategy';
import { getToken } from '../entities/token';
import {
  checkNullAddress,
  getAmountByProportion,
  setSyncingIndex,
} from '../utils/helper';
import { getUser } from '../entities/user';
import {
  getUserStrategyEpochYieldEntityId,
  getSharesFromUnderlyingAsset,
} from '../entities/strategy-user-details';
import { dataSource } from '@graphprotocol/graph-ts';
import { ZERO_BI } from '../utils/constants.template';

export function handleERC4626Deposit(event: DepositEvent) {
  let user = getUser(event.params.user.toHexString());
  let strategy = getStrategy(dataSource.address.toString());
  let token = getToken(event.address.toHexString());
  let asset = getToken(event.params.asset.toHexString());
  let underlyingAmountIn = event.params.underlyingAmountIn;
  let epochIndex = event.params.epochIndex;

  let entityId = getUserStrategyEpochYieldEntityId(user.id, strategy.id, epochIndex);

  let userStrategyEpochYield = UserStrategyEpochYield.load(entityId);

  if (!userStrategyEpochYield) {
    userStrategyEpochYield = new UserStrategyEpochYield(entityId);
    userStrategyEpochYield.epoch = epochIndex;
    userStrategyEpochYield.user = user.id;
    userStrategyEpochYield.token = token.id;
    userStrategyEpochYield.asset = asset.id;
    userStrategyEpochYield.assetAmount = underlyingAmountIn;

    let sharesAmount = getSharesFromUnderlyingAsset(strategy.id, underlyingAmountIn);
    userStrategyEpochYield.currentSharesAmount = sharesAmount;
    userStrategyEpochYield.totalSharesAmount = sharesAmount;

    setSyncingIndex('userstrategyepochyield', userStrategyEpochYield);
  } else {
    userStrategyEpochYield.assetAmount =
      userStrategyEpochYield.assetAmount.plus(underlyingAmountIn);

    let addedShares = getSharesFromUnderlyingAsset(strategy.id, underlyingAmountIn);
    userStrategyEpochYield.currentSharesAmount =
      userStrategyEpochYield.currentSharesAmount.plus(addedShares);
    userStrategyEpochYield.totalSharesAmount =
      userStrategyEpochYield.totalSharesAmount.plus(addedShares);
  }
  userStrategyEpochYield.save();
}

export function handleERC4626Withdraw(event: WithdrawEvent) {
  let strategyAddress = dataSource.address.toString();
  let underlyingAmount = event.params.underlyingAmountOut;
  let entityId = getUserStrategyEpochYieldEntityId(
    event.params.user.toHexString(),
    strategyAddress,
    event.params.epochIndex
  );

  let userStrategyEpochYield = UserStrategyEpochYield.load(entityId)!;

  // Update assetAmount & currentSharesAmount
  userStrategyEpochYield.assetAmount =
    userStrategyEpochYield.assetAmount.minus(underlyingAmount);

  let sharesRemoved = getSharesFromUnderlyingAsset(strategyAddress, underlyingAmount);
  userStrategyEpochYield.currentSharesAmount =
    userStrategyEpochYield.currentSharesAmount.minus(sharesRemoved);

  userStrategyEpochYield.save();
}

export function handleERC4626EpochYieldClaim(event: EpochYieldClaimEvent) {
  let strategy = getStrategy(event.address.toHexString());
  let asset = getToken(event.params.asset.toHexString());

  let epochIndex = event.params.epoch;
  let yieldClaimEntityId = `${strategy.id}-${epochIndex}`;

  let yieldClaim = new YieldClaim(yieldClaimEntityId);
  yieldClaim.epoch = epochIndex;
  yieldClaim.strategy = strategy.id;
  yieldClaim.asset = asset.id;
  yieldClaim.amount = event.params.yieldAmount;
  yieldClaim.timestamp = event.block.timestamp;

  setSyncingIndex('yieldclaim', yieldClaim);

  yieldClaim.save();
}

export function handleERC4626DistributeYield(event: DistributeYieldEvent) {
  let strategy = getStrategy(event.address.toHexString());
  let asset = getToken(event.params.underlyingAsset.toHexString());
  let beneficiary = getBeneficiary(event.params.beneficiary.toHexString());

  let epochIndex = event.params.epochIndex;
  let beneficiaryYieldDistribution = new BeneficiaryYieldDistribution(
    `${strategy.id}-${epochIndex}`
  );

  beneficiaryYieldDistribution.epoch = epochIndex;
  beneficiaryYieldDistribution.strategy = strategy.id;
  beneficiaryYieldDistribution.beneficiary = beneficiary.id;
  beneficiaryYieldDistribution.asset = asset.id;
  beneficiaryYieldDistribution.amount = event.params.amount;
  beneficiaryYieldDistribution.timestamp = event.block.timestamp;

  setSyncingIndex('beneficiaryyielddonation', beneficiaryYieldDistribution);
  beneficiaryYieldDistribution.save();
}

export function handleTransfer(event: TransferEvent) {
  let fromUser = getUser(event.params.from.toHexString());
  let toUser = getUser(event.params.to.toHexString());
  if (checkNullAddress(fromUser.id) || checkNullAddress(toUser.id)) return;

  let strategyAddress = dataSource.address.toString();
  let underlyingAmount = event.params.value;
  let epochIndex = ZERO_BI; // Retrieve from beneificary manager
  let fromEntityId = getUserStrategyEpochYieldEntityId(
    fromUser.id,
    strategyAddress,
    epochIndex
  );
  let toEntityId = getUserStrategyEpochYieldEntityId(
    toUser.id,
    strategyAddress,
    epochIndex
  );

  // @To-Do Handle transfer of asset and shares based on proportion
  let fromUserStrategyEpochYield = UserStrategyEpochYield.load(fromEntityId)!;

  // Deduct based on proportion of underlying asset deducted
  fromUserStrategyEpochYield.assetAmount =
    fromUserStrategyEpochYield.assetAmount.minus(underlyingAmount);

  let sharesTransferred = getAmountByProportion(
    fromUserStrategyEpochYield.currentSharesAmount,
    underlyingAmount,
    fromUserStrategyEpochYield.totalSharesAmount
  );

  fromUserStrategyEpochYield.currentSharesAmount =
    fromUserStrategyEpochYield.currentSharesAmount.minus(sharesTransferred);

  let toUserStrategyEpochYield = UserStrategyEpochYield.load(toEntityId);

  if (!toUserStrategyEpochYield) {
    toUserStrategyEpochYield = new UserStrategyEpochYield(toEntityId);
    toUserStrategyEpochYield.epoch = epochIndex;
    toUserStrategyEpochYield.user = toUser.id;
    toUserStrategyEpochYield.token = fromUserStrategyEpochYield.token;
    toUserStrategyEpochYield.asset = fromUserStrategyEpochYield.asset;
    toUserStrategyEpochYield.assetAmount = underlyingAmount;
    toUserStrategyEpochYield.currentSharesAmount = sharesTransferred;
    fromUserStrategyEpochYield.totalSharesAmount = sharesTransferred;

    setSyncingIndex('userstrategyepochyield', toUserStrategyEpochYield);
  } else {
    toUserStrategyEpochYield.assetAmount =
      toUserStrategyEpochYield.assetAmount.plus(underlyingAmount);
    toUserStrategyEpochYield.currentSharesAmount =
      toUserStrategyEpochYield.currentSharesAmount.plus(sharesTransferred);
    toUserStrategyEpochYield.totalSharesAmount =
      toUserStrategyEpochYield.totalSharesAmount.plus(sharesTransferred);
  }

  toUserStrategyEpochYield.save();
}
