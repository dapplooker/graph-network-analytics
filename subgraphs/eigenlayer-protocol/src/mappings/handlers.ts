import { Address, BigInt, Bytes, ethereum, log, store } from "@graphprotocol/graph-ts";

import {
    BIGINT_ZERO,
    ETH_ADDRESS,
    INT_FOUR,
    INT_THREE,
    INT_TWO,
    INT_ZERO,
    PoolType,
    TRANSFER_DATA_TYPE,
    TRANSFER_SIGNATURE,
    WITHDRAWAL_QUEUED_DATA_TYPE,
    WITHDRAWAL_QUEUED_SIGNATURE,
    ZERO_ADDRESS,
} from "../common/constants";
import {
    createPool,
    getOrCreateAccount,
    getOrCreateToken,
    getPool,
    getPoolBalance,
} from "../common/getters";
import {
    updatePoolIsActive,
    updateTVL,
    updateUsage,
    updateVolume,
} from "../common/metrics";
import {
    createDeposit, createVirtualStrategyObject,
    createWithdraw, createWithdrawTransfer,
    getWithdraw,
    updateWithdraw,
} from "../common/events";
import {
    updateFinancialsDailySnapshot,
    updatePoolDailySnapshot,
    updatePoolHourlySnapshot,
    updateUsageMetricsDailySnapshot,
    updateUsageMetricsHourlySnapshot,
} from "../common/snapshots";

import { PodDeployed } from "../../generated/EigenPodManager/EigenPodManager";
import { EigenPod } from "../../generated/EigenPodManager/EigenPod";
import {
    Deposit,
    ShareWithdrawalQueued,
    StrategyAddedToDepositWhitelist,
    StrategyRemovedFromDepositWhitelist,
    WithdrawalCompleted,
} from "../../generated/StrategyManager/StrategyManager";
import { Strategy } from "../../generated/StrategyManager/Strategy";
import {
    MinWithdrawalDelayBlocksSet as MinWithdrawalDelayBlocksSetEvent,
    OperatorDetailsModified as OperatorDetailsModifiedEvent,
    OperatorMetadataURIUpdated as OperatorMetadataURIUpdatedEvent,
    OperatorRegistered as OperatorRegisteredEvent,
    OperatorSharesDecreased as OperatorSharesDecreasedEvent,
    OperatorSharesIncreased as OperatorSharesIncreasedEvent,
    StakerDelegated as StakerDelegatedEvent,
    StakerForceUndelegated as StakerForceUndelegatedEvent,
    StakerUndelegated as StakerUndelegatedEvent,
    StrategyWithdrawalDelayBlocksSet as StrategyWithdrawalDelayBlocksSetEvent,
    WithdrawalMigrated as WithdrawalMigratedEvent,
    WithdrawalQueued as WithdrawalQueuedEvent
} from "../../generated/DelegationManager/DelegationManager";

import {
    WithdrawalCompleted as WithdrawalCompletedDM,
} from "../../generated/DelegationManager/DelegationManager";

import {
    MinWithdrawalDelayBlocksSet,
    OperatorShare,
    RegisteredOperators,
    StakerDelegatedHistory, StrategyWithdrawalDelayBlocksSet, Withdraw, WithdrawalMigrated, WithdrawEntityIdList
} from "../../generated/schema";
import { handleWithDrawComplete } from "../common/utils";


// ################################# Strategy Manager ###################################

export function handlePodDeployed(event: PodDeployed): void {
    const podAddress = event.params.eigenPod;
    const ownerAddress = event.params.podOwner;

    let isActive = false;
    const eigenPod = EigenPod.bind(podAddress);
    const hasRestakedCall = eigenPod.try_hasRestaked();
    if (!hasRestakedCall.reverted) {
        isActive = hasRestakedCall.value;
    } else {
        log.warning(
            "[handlePodDeployed] eigenPod.try_hasRestaked reverted for podAddress: {}",
            [event.params.eigenPod.toHexString()]
        );
    }

    const underlyingToken = getOrCreateToken(
        Address.fromString(ETH_ADDRESS),
        event
    );

    const poolName = "EigenPod-" + underlyingToken.name;
    const poolSymbol = "E-" + underlyingToken.symbol;
    createPool(podAddress, ownerAddress, poolName, poolSymbol, PoolType.EIGEN_POD, Address.fromBytes(underlyingToken.id), isActive, event);
}

export function handleStrategyAdded(event: StrategyAddedToDepositWhitelist): void {
    const strategyAddress = event.params.strategy;
    const strategyContract = Strategy.bind(strategyAddress);
    const underlyingTokenCall = strategyContract.try_underlyingToken();
    if (underlyingTokenCall.reverted) {
        log.error(
            "[handleStrategyAdded] strategyContract.try_underlyingToken() reverted for strategy: {}",
            [strategyAddress.toHexString()]
        );
        return;
    }
    const underlyingToken = getOrCreateToken(underlyingTokenCall.value, event);

    const poolName = "Strategy-" + underlyingToken.name;
    const poolSymbol = "S-" + underlyingToken.symbol;
    createPool(strategyAddress, null, poolName, poolSymbol, PoolType.STRATEGY, Address.fromBytes(underlyingToken.id), true, event);
}

export function handleStrategyRemoved(event: StrategyRemovedFromDepositWhitelist): void {
    const strategyAddress = event.params.strategy;
    updatePoolIsActive(strategyAddress, false);
}

export function handleDeposit(event: Deposit): void {
    const strategyAddress = event.params.strategy;
    const tokenAddress = event.params.token;
    const depositorAddress = event.params.depositor;
    const shares = event.params.shares;

    const pool = getPool(strategyAddress);
    const token = getOrCreateToken(tokenAddress, event);
    const account = getOrCreateAccount(depositorAddress);

    let amount = BIGINT_ZERO;
    const receipt = event.receipt;
    if (!receipt) {
        log.error("[handleDeposit] No event receipt. Tx: {}", [
            event.transaction.hash.toHexString(),
        ]);
        return;
    }
    const logs = receipt.logs;
    if (!logs) {
        log.error("[handleDeposit] No logs for event receipt. Tx: {}", [
            event.transaction.hash.toHexString(),
        ]);
        return;
    }

    for (let i = 0; i < logs.length; i++) {
        const thisLog = logs.at(i);
        const logTopicSignature = thisLog.topics.at(INT_ZERO);

        if (logTopicSignature.equals(TRANSFER_SIGNATURE)) {
            const logTopicTo = ethereum
                .decode("address", thisLog.topics.at(INT_TWO))!
                .toAddress();

            if (logTopicTo.equals(Address.fromBytes(pool.id))) {
                const decoded = ethereum.decode(TRANSFER_DATA_TYPE, thisLog.data);
                if (!decoded) continue;

                const logData = decoded.toTuple();
                amount = logData[INT_ZERO].toBigInt();
                break;
            }
        }
    }

    const depositID = createDeposit(Address.fromBytes(pool.id), Address.fromBytes(token.id), Address.fromBytes(account.id), shares, amount, event);
    updateUsage(Address.fromBytes(pool.id), Address.fromBytes(token.id), Address.fromBytes(account.id), true, amount, depositID, event);

    const poolBalance = getPoolBalance(Address.fromBytes(pool.id));

    updateTVL(Address.fromBytes(pool.id), Address.fromBytes(token.id), poolBalance, event);
    updateVolume(Address.fromBytes(pool.id), Address.fromBytes(token.id), true, amount, event);
    updatePoolHourlySnapshot(Address.fromBytes(pool.id), event);
    updatePoolDailySnapshot(Address.fromBytes(pool.id), Address.fromBytes(token.id), true, amount, event);
    updateUsageMetricsHourlySnapshot(Address.fromBytes(account.id), event);
    updateUsageMetricsDailySnapshot(Address.fromBytes(account.id), true, depositID, event);
    updateFinancialsDailySnapshot(Address.fromBytes(token.id), true, amount, event);
}

export function handleShareWithdrawalQueued(event: ShareWithdrawalQueued): void {
    const depositorAddress = event.params.depositor;
    const nonce = event.params.nonce;
    const strategyAddress = event.params.strategy;
    const shares = event.params.shares;

    const pool = getPool(strategyAddress);
    const token = getOrCreateToken(Address.fromBytes(pool.inputTokens[0]), event);
    const account = getOrCreateAccount(depositorAddress);

    let withdrawerAddress = event.params.depositor;
    let delegatedAddress = Address.fromString(ZERO_ADDRESS);
    let withdrawalRoot = Bytes.empty();

    const receipt = event.receipt;
    if (!receipt) {
        log.error("[handleShareWithdrawalQueued] No event receipt. Tx: {}", [
            event.transaction.hash.toHexString(),
        ]);
        return;
    }
    const logs = receipt.logs;
    if (!logs) {
        log.error(
            "[handleShareWithdrawalQueued] No logs for event receipt. Tx: {}",
            [event.transaction.hash.toHexString()]
        );
        return;
    }

    for (let i = 0; i < logs.length; i++) {
        const thisLog = logs.at(i);
        const logTopicSignature = thisLog.topics.at(INT_ZERO);

        if (logTopicSignature.equals(WITHDRAWAL_QUEUED_SIGNATURE)) {
            const decoded = ethereum.decode(
                WITHDRAWAL_QUEUED_DATA_TYPE,
                thisLog.data
            );
            if (!decoded) continue;

            const logData = decoded.toTuple();
            withdrawerAddress = logData[INT_TWO].toAddress();
            delegatedAddress = logData[INT_THREE].toAddress();
            withdrawalRoot = logData[INT_FOUR].toBytes();
            break;
        }
    }

    createWithdraw(Address.fromBytes(pool.id), Address.fromBytes(token.id),
        Address.fromBytes(account.id),
        withdrawerAddress,
        delegatedAddress,
        withdrawalRoot,
        nonce,
        shares,
        0,
        event
    );
}

export function handleWithdrawalCompleted(event: WithdrawalCompleted): void {
    const withdrawalRoot = event.params.withdrawalRoot;
    log.info("[handleWithdrawalCompleted] WithdrawalRoot for tx: {}, is {}",
        [event.transaction.hash.toHexString(), withdrawalRoot.toHexString()]);

    let withdraws = getWithdraw(withdrawalRoot);
    if (!withdraws) {
        log.warning("[handleWithdrawalCompleted] queued withdraw transaction not found for withdrawalRoot: {}",
            [withdrawalRoot.toHexString()]);
        return;
    }
    handleWithDrawComplete("Strategy", withdraws, event)
}


// ################################# Delegation Manager ###################################

export function handleMinWithdrawalDelayBlocksSet(event: MinWithdrawalDelayBlocksSetEvent): void {
    let entity = new MinWithdrawalDelayBlocksSet(event.transaction.hash.concatI32(event.logIndex.toI32()))

    entity.previousValue = event.params.previousValue
    entity.newValue = event.params.newValue

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
}

export function handleOperatorDetailsModified(event: OperatorDetailsModifiedEvent): void {
    let registeredOperator = RegisteredOperators.load(event.params.operator)
    if (!registeredOperator) {
        registeredOperator = new RegisteredOperators(event.params.operator)
    }

    registeredOperator!.operatorDetails_earningsReceiver = event.params.newOperatorDetails.earningsReceiver
    registeredOperator!.operatorDetails_delegationApprover = event.params.newOperatorDetails.delegationApprover
    registeredOperator!.operatorDetails_stakerOptOutWindowBlocks = event.params.newOperatorDetails.stakerOptOutWindowBlocks

    registeredOperator.createdAt = event.block.timestamp
    registeredOperator.updatedAt = event.block.timestamp

    registeredOperator!.save();
}

export function handleOperatorMetadataURIUpdated(event: OperatorMetadataURIUpdatedEvent): void {
    let registeredOperator = RegisteredOperators.load(event.params.operator)
    registeredOperator!.metadataURI = event.params.metadataURI
    registeredOperator!.updatedAt = event.block.timestamp

    registeredOperator!.save()
}

export function handleOperatorRegistered(event: OperatorRegisteredEvent): void {
    let registeredOperator = RegisteredOperators.load(event.params.operator)
    if (!registeredOperator) {
        registeredOperator = new RegisteredOperators(event.params.operator)
    }
    registeredOperator.operatorDetails_earningsReceiver = event.params.operatorDetails.earningsReceiver
    registeredOperator.operatorDetails_delegationApprover = event.params.operatorDetails.delegationApprover
    registeredOperator.operatorDetails_stakerOptOutWindowBlocks = event.params.operatorDetails.stakerOptOutWindowBlocks

    registeredOperator.createdAt = event.block.timestamp
    registeredOperator.updatedAt = event.block.timestamp

    registeredOperator.save()
}

export function handleOperatorSharesDecreased(event: OperatorSharesDecreasedEvent): void {
    let id = event.params.staker.concat(event.params.strategy)
    let entity = new OperatorShare(id)
    entity.operator = event.params.operator
    entity.staker = event.params.staker
    entity.strategy = event.params.strategy

    let strategyAddress = event.params.strategy
    if (strategyAddress.toHexString().toLowerCase() == "0xbeaC0eeEeeeeEEeEeEEEEeeEEeEeeeEeeEEBEaC0".toLowerCase()) {
        log.info("[handleOperatorSharesDecreased] Not counting virtual strategy. Tx: {}", [event.transaction.hash.toHexString()]);
        createVirtualStrategyObject(Address.fromString("0xbeaC0eeEeeeeEEeEeEEEEeeEEeEeeeEeeEEBEaC0"), event);
    }

    entity.shares = BigInt.fromI64(-1).times(event.params.shares)
    entity.createdAt = event.block.timestamp

    entity.save()
}

export function handleOperatorSharesIncreased(event: OperatorSharesIncreasedEvent): void {
    let id = event.params.staker.concat(event.params.strategy)
    let entity = new OperatorShare(id)
    entity.operator = event.params.operator
    entity.staker = event.params.staker
    entity.strategy = event.params.strategy

    let strategyAddress = event.params.strategy
    if (strategyAddress.toHexString().toLowerCase() == "0xbeaC0eeEeeeeEEeEeEEEEeeEEeEeeeEeeEEBEaC0".toLowerCase()) {
        log.error("[handleOperatorSharesDecreased] Not counting virtual strategy. Tx: {}", [event.transaction.hash.toHexString()]);
        createVirtualStrategyObject(Address.fromString("0xbeaC0eeEeeeeEEeEeEEEEeeEEeEeeeEeeEEBEaC0"), event);
    }

    entity.shares = event.params.shares
    entity.createdAt = event.block.timestamp

    entity.save()
}

export function handleStakerDelegated(event: StakerDelegatedEvent): void {
    let id = event.params.staker.concat(event.params.operator)
    let stakerDelegationHistory = new StakerDelegatedHistory(id)
    stakerDelegationHistory.staker = event.params.staker
    stakerDelegationHistory.operator = event.params.operator
    stakerDelegationHistory.operation = 1

    stakerDelegationHistory.delegatedAt = event.block.timestamp
    stakerDelegationHistory.transactionHash = event.transaction.hash

    stakerDelegationHistory.save()
}

export function handleStakerForceUndelegated(event: StakerForceUndelegatedEvent): void {
    let id = event.params.staker.concat(event.params.operator)
    let stakerDelegationHistory = new StakerDelegatedHistory(id)
    stakerDelegationHistory.staker = event.params.staker
    stakerDelegationHistory.operator = event.params.operator
    stakerDelegationHistory.operation = 3

    stakerDelegationHistory.undelegatedAt = event.block.timestamp

    stakerDelegationHistory.save()
}

export function handleStakerUndelegated(event: StakerUndelegatedEvent): void {
    let id = event.params.staker.concat(event.params.operator)
    let stakerDelegationHistory = new StakerDelegatedHistory(id)
    stakerDelegationHistory.staker = event.params.staker
    stakerDelegationHistory.operator = event.params.operator
    stakerDelegationHistory.operation = 2

    stakerDelegationHistory.undelegatedAt = event.block.timestamp

    stakerDelegationHistory.save()
}

export function handleStrategyWithdrawalDelayBlocksSet(event: StrategyWithdrawalDelayBlocksSetEvent): void {
    let entity = new StrategyWithdrawalDelayBlocksSet(event.transaction.hash.concatI32(event.logIndex.toI32()))
    entity.strategy = event.params.strategy
    entity.previousValue = event.params.previousValue
    entity.newValue = event.params.newValue

    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    entity.save()
    createVirtualStrategyObject(Address.fromString("0xbeaC0eeEeeeeEEeEeEEEEeeEEeEeeeEeeEEBEaC0"), event);
}

export function handleWithdrawalMigrated(event: WithdrawalMigratedEvent): void {
    let withdrawalMigrated = new WithdrawalMigrated(event.transaction.hash.concatI32(event.logIndex.toI32()))
    withdrawalMigrated.oldWithdrawalRoot = event.params.oldWithdrawalRoot
    withdrawalMigrated.newWithdrawalRoot = event.params.newWithdrawalRoot

    let withdrawEntities = WithdrawEntityIdList.load(event.params.oldWithdrawalRoot);
    let entitiesIds = withdrawEntities!.withdrawalIds
    for (let i = 0; i < entitiesIds.length; i++) {
        let withdrawID = entitiesIds[i];
        store.remove('Withdraw', withdrawID.toHexString());
    }

    withdrawalMigrated.blockNumber = event.block.number
    withdrawalMigrated.blockTimestamp = event.block.timestamp
    withdrawalMigrated.transactionHash = event.transaction.hash
    withdrawalMigrated.save()
}

export function handleWithdrawalQueued(event: WithdrawalQueuedEvent): void {
    const withdrawalRoot = event.params.withdrawalRoot
    const depositorAddress = event.params.withdrawal.staker
    const delegatedAddress = event.params.withdrawal.delegatedTo
    const withdrawerAddress = event.params.withdrawal.withdrawer
    const nonce = event.params.withdrawal.nonce

    let withdrawalStrategies = new Array<Bytes>()
    for (let i = 0; i < event.params.withdrawal.strategies.length; ++i) {
        let strategyAddress = event.params.withdrawal.strategies[i].toHexString()
        log.info("[handleWithdrawalQueued] Withdrawal strategy: {} for tx: {}", [
            strategyAddress,
            event.transaction.hash.toHexString()]
        )

        if (strategyAddress.toLowerCase() == "0xbeaC0eeEeeeeEEeEeEEEEeeEEeEeeeEeeEEBEaC0".toLowerCase()) {
            // createVirtualStrategyObject(event.params.withdrawal.strategies[i], event);
            continue;
        }

        withdrawalStrategies.push(Bytes.fromHexString(event.params.withdrawal.strategies[i].toHexString()))
        let shares = event.params.withdrawal.shares[i]

        const pool = getPool(event.params.withdrawal.strategies[i]);
        const token = getOrCreateToken(Address.fromBytes(pool.inputTokens[0]), event);
        const account = getOrCreateAccount(depositorAddress);

        createWithdraw(Address.fromBytes(pool.id), Address.fromBytes(token.id), Address.fromBytes(account.id),
            withdrawerAddress, delegatedAddress, withdrawalRoot, nonce, shares, i, event);
    }
}

export function handleWithdrawalCompletedDM(event: WithdrawalCompletedDM): void {
    const withdrawalRoot = event.params.withdrawalRoot;
    log.info("[handleWithdrawalCompletedDM] WithdrawalRoot for tx: {}, is {}", [event.transaction.hash.toHexString(), withdrawalRoot.toHexString()]);

    let withdraws = getWithdraw(withdrawalRoot);
    if (!withdraws) {
        log.warning("[handleWithdrawalCompletedDM] queued withdraw transaction not found for withdrawalRoot: {}", [withdrawalRoot.toHexString()]);
        return;
    }

    handleWithDrawComplete("Delegation", withdraws, event)
}
