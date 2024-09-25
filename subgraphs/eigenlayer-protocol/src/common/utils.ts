import { Address, BigDecimal, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import {
    BIGINT_TEN,
    ETHEREUM_AVG_BLOCKS_PER_DAY,
    ETH_DECIMALS,
    SECONDS_PER_DAY,
    SECONDS_PER_HOUR, BIGINT_ZERO, INT_ZERO, TRANSFER_SIGNATURE, INT_ONE, TRANSFER_DATA_TYPE,
} from "./constants";
import {
    getOrCreateFinancialsDailySnapshot,
    getOrCreatePoolDailySnapshot,
    getOrCreateUsageMetricsDailySnapshot, getPoolBalance,
} from "./getters";

import {
    FinancialsDailySnapshot,
    PoolDailySnapshot,
    UsageMetricsDailySnapshot, Withdraw,
} from "../../generated/schema";
import { createWithdrawTransfer, updateWithdraw } from "./events";
import { updateTVL, updateUsage, updateVolume } from "./metrics";
import {
    updateFinancialsDailySnapshot,
    updatePoolDailySnapshot,
    updatePoolHourlySnapshot,
    updateUsageMetricsDailySnapshot,
    updateUsageMetricsHourlySnapshot
} from "./snapshots";

export function getHoursSinceEpoch(secondsSinceEpoch: number): i32 {
    return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_HOUR);
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): i32 {
    return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY);
}

export function bigIntToBigDecimal(
    quantity: BigInt,
    decimals: i32 = ETH_DECIMALS
): BigDecimal {
    return quantity.divDecimal(BIGINT_TEN.pow(decimals as u8).toBigDecimal());
}

export function addToArrayAtIndex<T>(x: T[], item: T, index: i32 = -1): T[] {
    if (x.length == 0) {
        return [item];
    }
    if (index == -1 || index > x.length) {
        index = x.length;
    }
    const retval = new Array<T>();
    let i = 0;
    while (i < index) {
        retval.push(x[i]);
        i += 1;
    }
    retval.push(item);
    while (i < x.length) {
        retval.push(x[i]);
        i += 1;
    }
    return retval;
}

export function removeFromArrayAtIndex<T>(x: T[], index: i32): T[] {
    const retval = new Array<T>(x.length - 1);
    let nI = 0;
    for (let i = 0; i < x.length; i++) {
        if (i != index) {
            retval[nI] = x[i];
            nI += 1;
        }
    }
    return retval;
}

export function updateArrayAtIndex<T>(x: T[], item: T, index: i32): T[] {
    if (x.length == 0) {
        return [item];
    }
    if (index == -1 || index > x.length) {
        index = x.length;
    }
    const retval = new Array<T>();
    let i = 0;
    while (i < index) {
        retval.push(x[i]);
        i += 1;
    }
    retval.push(item);
    i += 1;
    while (i < x.length) {
        retval.push(x[i]);
        i += 1;
    }
    return retval;
}

export function accountArraySort(
    pools: Array<Bytes>,
    poolBalance: Array<BigInt>,
    poolBalanceUSD: Array<BigDecimal>,
    _hasWithdrawnFromPool: Array<boolean>
): void {
    if (
        pools.length != poolBalance.length ||
        pools.length != poolBalanceUSD.length ||
        pools.length != _hasWithdrawnFromPool.length
    ) {
        return;
    }

    const sorter: Array<Array<string>> = [];
    for (let i = 0; i < pools.length; i++) {
        sorter[i] = [
            pools[i].toHexString(),
            poolBalance[i].toString(),
            poolBalanceUSD[i].toString(),
            _hasWithdrawnFromPool[i].toString(),
        ];
    }

    sorter.sort(function (a: Array<string>, b: Array<string>): i32 {
        if (a[0] < b[0]) {
            return -1;
        }
        return 1;
    });

    for (let i = 0; i < sorter.length; i++) {
        pools[i] = Bytes.fromHexString(sorter[i][0]);
        poolBalance[i] = BigInt.fromString(sorter[i][1]);
        poolBalanceUSD[i] = BigDecimal.fromString(sorter[i][2]);
        _hasWithdrawnFromPool[i] = sorter[i][3] == "true";
    }
}

export function findPreviousPoolDailySnapshot(
    poolAddress: Address,
    currentSnapshotDay: number
): PoolDailySnapshot | null {
    let previousDay = (currentSnapshotDay - 1) as i32;
    let previousId = Bytes.empty()
        .concat(poolAddress)
        .concat(Bytes.fromUTF8("-"))
        .concat(Bytes.fromI32(previousDay));
    let previousSnapshot = PoolDailySnapshot.load(previousId);

    while (!previousSnapshot && previousDay > 0) {
        previousDay--;
        previousId = Bytes.empty()
            .concat(poolAddress)
            .concat(Bytes.fromUTF8("-"))
            .concat(Bytes.fromI32(previousDay));
        previousSnapshot = PoolDailySnapshot.load(previousId);
    }
    return previousSnapshot;
}

export function fillInMissingPoolDailySnapshots(
    poolAddress: Address,
    currentSnapshotDay: i32
): void {
    const previousSnapshot = findPreviousPoolDailySnapshot(
        poolAddress,
        currentSnapshotDay
    );
    if (previousSnapshot) {
        let counter = 1;
        for (let i = previousSnapshot.day + 1; i < currentSnapshotDay; i++) {
            const snapshot = getOrCreatePoolDailySnapshot(poolAddress, i as i32);

            snapshot.totalValueLockedUSD = previousSnapshot.totalValueLockedUSD;
            snapshot.inputTokenBalances = previousSnapshot.inputTokenBalances;
            snapshot.inputTokenBalancesUSD = previousSnapshot.inputTokenBalancesUSD;
            snapshot.cumulativeDepositVolumeAmount =
                previousSnapshot.cumulativeDepositVolumeAmount;
            snapshot.cumulativeDepositVolumeUSD =
                previousSnapshot.cumulativeDepositVolumeUSD;
            snapshot.cumulativeWithdrawalVolumeAmount =
                previousSnapshot.cumulativeWithdrawalVolumeAmount;
            snapshot.cumulativeWithdrawalVolumeUSD =
                previousSnapshot.cumulativeWithdrawalVolumeUSD;
            snapshot.cumulativeTotalVolumeAmount =
                previousSnapshot.cumulativeTotalVolumeAmount;
            snapshot.cumulativeTotalVolumeUSD =
                previousSnapshot.cumulativeTotalVolumeUSD;
            snapshot.netVolumeAmount = previousSnapshot.netVolumeAmount;
            snapshot.netVolumeUSD = previousSnapshot.netVolumeUSD;
            snapshot.cumulativeUniqueDepositors =
                previousSnapshot.cumulativeUniqueDepositors;
            snapshot.cumulativeUniqueWithdrawers =
                previousSnapshot.cumulativeUniqueWithdrawers;
            snapshot.cumulativeDepositCount = previousSnapshot.cumulativeDepositCount;
            snapshot.cumulativeWithdrawalCount =
                previousSnapshot.cumulativeWithdrawalCount;
            snapshot.cumulativeTransactionCount =
                previousSnapshot.cumulativeTransactionCount;

            snapshot.timestamp = previousSnapshot.timestamp!.plus(
                BigInt.fromI32((counter * SECONDS_PER_DAY) as i32)
            );
            snapshot.blockNumber = previousSnapshot.blockNumber!.plus(
                BigInt.fromI32((counter * ETHEREUM_AVG_BLOCKS_PER_DAY) as i32)
            );
            counter++;

            snapshot.save();
        }
    }
}

export function findPreviousUsageMetricsDailySnapshot(
    currentSnapshotDay: number
): UsageMetricsDailySnapshot | null {
    let previousDay = (currentSnapshotDay - 1) as i32;
    let previousId = Bytes.fromI32(previousDay);
    let previousSnapshot = UsageMetricsDailySnapshot.load(previousId);

    while (!previousSnapshot && previousDay > 0) {
        previousDay--;
        previousId = Bytes.fromI32(previousDay);
        previousSnapshot = UsageMetricsDailySnapshot.load(previousId);
    }
    return previousSnapshot;
}

export function fillInMissingUsageMetricsDailySnapshots(
    currentSnapshotDay: i32
): void {
    const previousSnapshot = findPreviousUsageMetricsDailySnapshot(currentSnapshotDay);
    if (previousSnapshot) {
        let counter = 1;
        for (let i = previousSnapshot.day + 1; i < currentSnapshotDay; i++) {
            const snapshot = getOrCreateUsageMetricsDailySnapshot(i as i32);

            snapshot.cumulativeUniqueDepositors =
                previousSnapshot.cumulativeUniqueDepositors;
            snapshot.cumulativeUniqueWithdrawers =
                previousSnapshot.cumulativeUniqueWithdrawers;
            snapshot.cumulativeUniqueUsers = previousSnapshot.cumulativeUniqueUsers;
            snapshot.cumulativeDepositCount = previousSnapshot.cumulativeDepositCount;
            snapshot.cumulativeWithdrawalCount =
                previousSnapshot.cumulativeWithdrawalCount;
            snapshot.cumulativeTransactionCount =
                previousSnapshot.cumulativeTransactionCount;
            snapshot.totalPoolCount = previousSnapshot.totalPoolCount;

            snapshot.timestamp = previousSnapshot.timestamp!.plus(
                BigInt.fromI32((counter * SECONDS_PER_DAY) as i32)
            );
            snapshot.blockNumber = previousSnapshot.blockNumber!.plus(
                BigInt.fromI32((counter * ETHEREUM_AVG_BLOCKS_PER_DAY) as i32)
            );
            counter++;

            snapshot.save();
        }
    }
}

export function findPreviousFinancialsDailySnapshot(
    currentSnapshotDay: number
): FinancialsDailySnapshot | null {
    let previousDay = (currentSnapshotDay - 1) as i32;
    let previousId = Bytes.fromI32(previousDay);
    let previousSnapshot = FinancialsDailySnapshot.load(previousId);

    while (!previousSnapshot && previousDay > 0) {
        previousDay--;
        previousId = Bytes.fromI32(previousDay);
        previousSnapshot = FinancialsDailySnapshot.load(previousId);
    }
    return previousSnapshot;
}

export function fillInMissingFinancialsDailySnapshots(
    currentSnapshotDay: i32
): void {
    const previousSnapshot =
        findPreviousFinancialsDailySnapshot(currentSnapshotDay);
    if (previousSnapshot) {
        let counter = 1;
        for (let i = previousSnapshot.day + 1; i < currentSnapshotDay; i++) {
            const snapshot = getOrCreateFinancialsDailySnapshot(i as i32);

            snapshot.totalValueLockedUSD = previousSnapshot.totalValueLockedUSD;
            snapshot.cumulativeDepositVolumeUSD =
                previousSnapshot.cumulativeDepositVolumeUSD;
            snapshot.cumulativeWithdrawalVolumeUSD =
                previousSnapshot.cumulativeWithdrawalVolumeUSD;
            snapshot.cumulativeTotalVolumeUSD =
                previousSnapshot.cumulativeTotalVolumeUSD;
            snapshot.netVolumeUSD = previousSnapshot.netVolumeUSD;

            snapshot.timestamp = previousSnapshot.timestamp!.plus(
                BigInt.fromI32((counter * SECONDS_PER_DAY) as i32)
            );
            snapshot.blockNumber = previousSnapshot.blockNumber!.plus(
                BigInt.fromI32((counter * ETHEREUM_AVG_BLOCKS_PER_DAY) as i32)
            );
            counter++;

            snapshot.save();
        }
    }
}


export function handleWithDrawComplete(contract: string, withdraws: Withdraw[], event: ethereum.Event): void {
    let withdrawMarkedCompleted: Bytes[] = [];
    for (let i = 0; i < withdraws.length; i++) {
        let withdraw = withdraws[i]
        const withdrawID = withdraw!.id;
        const poolID = withdraw!.pool;
        const tokenID = withdraw!.token;
        const accountID = withdraw!.depositor;

        const receipt = event.receipt;
        if (!receipt) {
            log.error("[handleWithdrawalCompleted] No event receipt. Tx: {}, contract: {}", [event.transaction.hash.toHexString(), contract]);
            continue;
        }
        const logs = receipt.logs;
        if (!logs) {
            log.error("[handleWithdrawalCompleted] No logs for event receipt. Tx: {}, contract: {}", [event.transaction.hash.toHexString(), contract]);
            continue;
        }

        for (let i = 0; i < logs.length; i++) {
            let amount = BIGINT_ZERO;
            const thisLog = logs.at(i);
            let eventId = thisLog.logIndex
            const logTopicSignature = thisLog.topics.at(INT_ZERO);

            log.info("[handleWithdrawalCompleted] Comparing log signature at Tx: {}, contract: {}", [event.transaction.hash.toHexString(), contract]);
            if (logTopicSignature.equals(TRANSFER_SIGNATURE)) {
                log.info("[handleWithdrawalCompleted] Matching logs sign for Tx: {}, contract: {}", [event.transaction.hash.toHexString(), contract]);
                // const decoded = ethereum.decode(TRANSFER_DATA_TYPE, thisLog.data);
                // if (!decoded) continue;
                //
                // const logData = decoded.toTuple();
                // amount = logData[INT_ZERO].toBigInt();
                //
                // for (let i = 0; i < thisLog.topics.length; i++) {
                //     log.info("[handleWithdrawalCompleted] Log Topic details: {}: {}", [i.toString(), thisLog.topics[i].toHexString()]);
                // }

                const sourceAddress = ethereum.decode("address", thisLog.topics.at(INT_ONE))!;
                log.info("[handleWithdrawalCompleted] Address from transfer event: {}, contract: {}", [sourceAddress.toAddress().toString(), contract]);
                const logTopicFrom = sourceAddress!.toAddress();

                log.info("[handleWithdrawalCompleted] Amount Details: {}, Tx: {}, contract: {}", [thisLog.data.toHexString(), event.transaction.hash.toHexString(), contract]);
                if (logTopicFrom.equals(Address.fromBytes(poolID))) {
                    const decoded = ethereum.decode(TRANSFER_DATA_TYPE, thisLog.data);
                    if (!decoded) continue;

                    const logData = decoded.toTuple();
                    amount = logData[INT_ZERO].toBigInt();
                    log.info("[handleWithdrawalCompleted] Amount Details: {}, Topic: {}, Tx: {}, contract: {}", [
                        amount.toString(),
                        thisLog.topics[0].toHexString(),
                        event.transaction.hash.toHexString(),
                        contract]
                    );
                }
            }

            if (amount.gt(BIGINT_ZERO)) {
                const poolBalance = getPoolBalance(Address.fromBytes(poolID));
                createWithdrawTransfer(Address.fromBytes(poolID), Address.fromBytes(tokenID), amount, event, withdrawID, eventId);
                updateUsage(Address.fromBytes(poolID), Address.fromBytes(tokenID), Address.fromBytes(accountID), false, amount, withdrawID, event);
                updateTVL(Address.fromBytes(poolID), Address.fromBytes(tokenID), poolBalance, event);
                updateVolume(Address.fromBytes(poolID), Address.fromBytes(tokenID), false, amount, event);
                updatePoolHourlySnapshot(Address.fromBytes(poolID), event);
                updatePoolDailySnapshot(Address.fromBytes(poolID), Address.fromBytes(tokenID), false, amount, event);
                updateUsageMetricsHourlySnapshot(Address.fromBytes(accountID), event);
                updateUsageMetricsDailySnapshot(Address.fromBytes(accountID), false, withdrawID, event);
                updateFinancialsDailySnapshot(Address.fromBytes(tokenID), false, amount, event);
            }

            if (!withdrawMarkedCompleted.includes(withdrawID)) {
                updateWithdraw(Address.fromBytes(accountID), Address.fromBytes(tokenID), withdrawID, amount, event);
                withdrawMarkedCompleted.push(withdrawID)
            }
        }
    }
}
