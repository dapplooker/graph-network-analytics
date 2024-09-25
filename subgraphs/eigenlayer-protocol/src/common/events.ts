import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { PoolType, ZERO_ADDRESS } from "./constants";
import { createPool, getOrCreateAccount, getOrCreateToken } from "./getters";
import {
    addToArrayAtIndex,
    bigIntToBigDecimal,
    removeFromArrayAtIndex,
} from "./utils";
import { Deposit, Pool, Withdraw, WithdrawalTransfer, WithdrawEntityIdList } from "../../generated/schema";


export function createDeposit(
    poolAddress: Address,
    tokenAddress: Address,
    accountAddress: Address,
    shares: BigInt,
    amount: BigInt,
    event: ethereum.Event
): Bytes {
    const token = getOrCreateToken(tokenAddress, event);
    const id = Bytes.empty().concat(event.transaction.hash).concatI32(event.logIndex.toI32());

    const depositEvent = new Deposit(id);
    depositEvent.hash = event.transaction.hash;
    depositEvent.logIndex = event.logIndex.toI32();
    depositEvent.protocol = Address.fromString("0x369e6f597e22eab55ffb173c6d9cd234bd699111");
    depositEvent.to = event.transaction.to ? event.transaction.to! : Address.fromString(ZERO_ADDRESS);
    depositEvent.from = event.transaction.from;
    depositEvent.depositor = accountAddress;
    depositEvent.pool = poolAddress;
    depositEvent.token = tokenAddress;
    depositEvent.shares = shares;
    depositEvent.amount = amount;
    depositEvent.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(token.lastPriceUSD!);
    depositEvent.blockNumber = event.block.number;
    depositEvent.timestamp = event.block.timestamp;

    depositEvent.save();
    return depositEvent.id;
}

export function createWithdraw(
    poolAddress: Address,
    tokenAddress: Address,
    accountAddress: Address,
    withdrawerAddress: Address,
    delegatedAddress: Address,
    withdrawalRoot: Bytes,
    nonce: BigInt,
    shares: BigInt,
    shareIdx: i32,
    event: ethereum.Event
): Bytes {
    const id = Bytes.empty().concat(event.transaction.hash).concatI32(event.logIndex.toI32()).concatI32(shareIdx);

    const withdrawEvent = new Withdraw(id);
    withdrawEvent.hash = event.transaction.hash;
    withdrawEvent.logIndex = event.logIndex.toI32();
    withdrawEvent.protocol = Address.fromString("0x369e6f597e22eab55ffb173c6d9cd234bd699111");
    withdrawEvent.to = event.transaction.to ? event.transaction.to! : Address.fromString(ZERO_ADDRESS);
    withdrawEvent.from = event.transaction.from;
    withdrawEvent.depositor = accountAddress;
    withdrawEvent.withdrawer = withdrawerAddress;
    withdrawEvent.delegatedTo = delegatedAddress;
    withdrawEvent.withdrawalRoot = withdrawalRoot;
    withdrawEvent.nonce = nonce;
    withdrawEvent.pool = poolAddress;
    withdrawEvent.token = tokenAddress;
    withdrawEvent.shares = shares;
    withdrawEvent.blockNumber = event.block.number;
    withdrawEvent.timestamp = event.block.timestamp;

    // Populated on WithdrawalCompleted event
    withdrawEvent.completed = false;
    withdrawEvent.hashCompleted = Bytes.empty();

    withdrawEvent.save();

    const account = getOrCreateAccount(accountAddress);
    account.withdrawsQueued = addToArrayAtIndex(
        account.withdrawsQueued,
        withdrawEvent.id
    );
    account.save();

    let withdrawEntityIdList = WithdrawEntityIdList.load(withdrawalRoot);
    if (withdrawEntityIdList) {
        let entityIdList = withdrawEntityIdList.withdrawalIds;
        entityIdList.push(id)
        withdrawEntityIdList.withdrawalIds = entityIdList
    } else {
        withdrawEntityIdList = new WithdrawEntityIdList(withdrawalRoot);
        let entityIdList = [id]
        withdrawEntityIdList.withdrawalIds = entityIdList
    }
    withdrawEntityIdList.save();

    return withdrawEvent.id;
}


export function createWithdrawTransfer(
    poolAddress: Address,
    tokenAddress: Address,
    amount: BigInt,
    event: ethereum.Event,
    withdrawID: Bytes,
    eventLogIndex: BigInt
): void {
    const id = Bytes.empty().concat(event.transaction.hash).concatI32(eventLogIndex.toI32());
    log.info("[createWithdrawTransfer] Creating withdrawal transfer with id {}. Tx: {}", [id.toHexString(), event.transaction.hash.toHexString()]);
    const token = getOrCreateToken(tokenAddress, event);

    const withdrawalTransfersEvent = new WithdrawalTransfer(id);
    withdrawalTransfersEvent.pool = poolAddress;
    withdrawalTransfersEvent.token = tokenAddress;
    withdrawalTransfersEvent.amount = amount;
    withdrawalTransfersEvent.amountUSD = bigIntToBigDecimal(amount).times(token.lastPriceUSD!);
    withdrawalTransfersEvent.withdrawID = withdrawID;
    withdrawalTransfersEvent.logIndex = eventLogIndex;
    withdrawalTransfersEvent.blockNumber = event.block.number;
    withdrawalTransfersEvent.timestamp = event.block.timestamp;
    withdrawalTransfersEvent.transactionHash = event.transaction.hash;
    withdrawalTransfersEvent.save();
}

export function getWithdraw(withdrawalRoot: Bytes): Withdraw[] {
    let withdrawEntities = WithdrawEntityIdList.load(withdrawalRoot);
    let allWithdraws: Withdraw[] = [];
    if (!withdrawEntities) {
        return [];
    }
    let entitiesIds = withdrawEntities!.withdrawalIds
    for (let i = 0; i < entitiesIds.length; i++) {
        let withdrawID = entitiesIds[i];
        const withdrawEvent = Withdraw.load(withdrawID)!;

        if (withdrawEvent.withdrawalRoot == withdrawalRoot) {
            allWithdraws.push(withdrawEvent);
        }
    }

    return allWithdraws;
}

export function updateWithdraw(accountAddress: Address, tokenAddress: Address, withdrawID: Bytes, amount: BigInt, event: ethereum.Event): void {
    const token = getOrCreateToken(tokenAddress, event);

    const withdrawEvent = Withdraw.load(withdrawID)!;
    withdrawEvent.hashCompleted = event.transaction.hash;
    withdrawEvent.completed = true;
    withdrawEvent.blockNumberCompleted = event.block.number;
    withdrawEvent.save();

    const account = getOrCreateAccount(accountAddress);
    const i = account.withdrawsQueued.indexOf(withdrawID);
    if (i > 0) {
        account.withdrawsQueued = removeFromArrayAtIndex(account.withdrawsQueued, i);
        account.withdrawsCompleted = addToArrayAtIndex(
            account.withdrawsCompleted,
            withdrawEvent.id
        );
        account.save();
    }
}


export function createVirtualStrategyObject(strategyAddress: Address, event: ethereum.Event): void {
    let poolLoad = Pool.load(strategyAddress);
    if (poolLoad) {
        return;
    }
    const underlyingToken = getOrCreateToken(Address.fromString("0xf1c9acdc66974dfb6decb12aa385b9cd01190e38"), event);

    const poolName = "Strategy-ETH";
    const poolSymbol = "S-ETH";
    createPool(strategyAddress, null, poolName, poolSymbol, PoolType.STRATEGY, Address.fromBytes(underlyingToken.id), true, event);
}
