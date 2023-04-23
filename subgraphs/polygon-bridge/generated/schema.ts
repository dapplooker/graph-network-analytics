// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class LockedERC20Event extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save LockedERC20Event entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type LockedERC20Event must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("LockedERC20Event", id.toString(), this);
    }
  }

  static load(id: string): LockedERC20Event | null {
    return changetype<LockedERC20Event | null>(
      store.get("LockedERC20Event", id)
    );
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get txHash(): Bytes | null {
    let value = this.get("txHash");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set txHash(value: Bytes | null) {
    if (!value) {
      this.unset("txHash");
    } else {
      this.set("txHash", Value.fromBytes(<Bytes>value));
    }
  }

  get fromAddress(): Bytes | null {
    let value = this.get("fromAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set fromAddress(value: Bytes | null) {
    if (!value) {
      this.unset("fromAddress");
    } else {
      this.set("fromAddress", Value.fromBytes(<Bytes>value));
    }
  }

  get toAddress(): Bytes | null {
    let value = this.get("toAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set toAddress(value: Bytes | null) {
    if (!value) {
      this.unset("toAddress");
    } else {
      this.set("toAddress", Value.fromBytes(<Bytes>value));
    }
  }

  get valueTransferred(): BigInt | null {
    let value = this.get("valueTransferred");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set valueTransferred(value: BigInt | null) {
    if (!value) {
      this.unset("valueTransferred");
    } else {
      this.set("valueTransferred", Value.fromBigInt(<BigInt>value));
    }
  }

  get gasUsed(): BigInt | null {
    let value = this.get("gasUsed");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set gasUsed(value: BigInt | null) {
    if (!value) {
      this.unset("gasUsed");
    } else {
      this.set("gasUsed", Value.fromBigInt(<BigInt>value));
    }
  }

  get gasPrice(): BigInt | null {
    let value = this.get("gasPrice");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set gasPrice(value: BigInt | null) {
    if (!value) {
      this.unset("gasPrice");
    } else {
      this.set("gasPrice", Value.fromBigInt(<BigInt>value));
    }
  }

  get blockTimestamp(): BigInt {
    let value = this.get("blockTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockTimestamp(value: BigInt) {
    this.set("blockTimestamp", Value.fromBigInt(value));
  }

  get depositor(): Bytes {
    let value = this.get("depositor");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set depositor(value: Bytes) {
    this.set("depositor", Value.fromBytes(value));
  }

  get depositReceiver(): Bytes {
    let value = this.get("depositReceiver");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set depositReceiver(value: Bytes) {
    this.set("depositReceiver", Value.fromBytes(value));
  }

  get rootToken(): Bytes {
    let value = this.get("rootToken");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set rootToken(value: Bytes) {
    this.set("rootToken", Value.fromBytes(value));
  }

  get amount(): BigInt {
    let value = this.get("amount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set amount(value: BigInt) {
    this.set("amount", Value.fromBigInt(value));
  }
}

export class ExitTokensCall extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save ExitTokensCall entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type ExitTokensCall must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("ExitTokensCall", id.toString(), this);
    }
  }

  static load(id: string): ExitTokensCall | null {
    return changetype<ExitTokensCall | null>(store.get("ExitTokensCall", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get txHash(): Bytes | null {
    let value = this.get("txHash");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set txHash(value: Bytes | null) {
    if (!value) {
      this.unset("txHash");
    } else {
      this.set("txHash", Value.fromBytes(<Bytes>value));
    }
  }

  get fromAddress(): Bytes {
    let value = this.get("fromAddress");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set fromAddress(value: Bytes) {
    this.set("fromAddress", Value.fromBytes(value));
  }

  get toAddress(): Bytes | null {
    let value = this.get("toAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set toAddress(value: Bytes | null) {
    if (!value) {
      this.unset("toAddress");
    } else {
      this.set("toAddress", Value.fromBytes(<Bytes>value));
    }
  }

  get valueTransferred(): BigInt | null {
    let value = this.get("valueTransferred");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set valueTransferred(value: BigInt | null) {
    if (!value) {
      this.unset("valueTransferred");
    } else {
      this.set("valueTransferred", Value.fromBigInt(<BigInt>value));
    }
  }

  get gasUsed(): BigInt | null {
    let value = this.get("gasUsed");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set gasUsed(value: BigInt | null) {
    if (!value) {
      this.unset("gasUsed");
    } else {
      this.set("gasUsed", Value.fromBigInt(<BigInt>value));
    }
  }

  get gasPrice(): BigInt | null {
    let value = this.get("gasPrice");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set gasPrice(value: BigInt | null) {
    if (!value) {
      this.unset("gasPrice");
    } else {
      this.set("gasPrice", Value.fromBigInt(<BigInt>value));
    }
  }

  get blockTimestamp(): BigInt {
    let value = this.get("blockTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockTimestamp(value: BigInt) {
    this.set("blockTimestamp", Value.fromBigInt(value));
  }

  get value0(): Bytes {
    let value = this.get("value0");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set value0(value: Bytes) {
    this.set("value0", Value.fromBytes(value));
  }

  get rootToken(): Bytes {
    let value = this.get("rootToken");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set rootToken(value: Bytes) {
    this.set("rootToken", Value.fromBytes(value));
  }

  get log(): Bytes {
    let value = this.get("log");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set log(value: Bytes) {
    this.set("log", Value.fromBytes(value));
  }
}

export class LockTokensCall extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save LockTokensCall entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type LockTokensCall must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`
      );
      store.set("LockTokensCall", id.toString(), this);
    }
  }

  static load(id: string): LockTokensCall | null {
    return changetype<LockTokensCall | null>(store.get("LockTokensCall", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get txHash(): Bytes | null {
    let value = this.get("txHash");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set txHash(value: Bytes | null) {
    if (!value) {
      this.unset("txHash");
    } else {
      this.set("txHash", Value.fromBytes(<Bytes>value));
    }
  }

  get fromAddress(): Bytes {
    let value = this.get("fromAddress");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set fromAddress(value: Bytes) {
    this.set("fromAddress", Value.fromBytes(value));
  }

  get toAddress(): Bytes | null {
    let value = this.get("toAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBytes();
    }
  }

  set toAddress(value: Bytes | null) {
    if (!value) {
      this.unset("toAddress");
    } else {
      this.set("toAddress", Value.fromBytes(<Bytes>value));
    }
  }

  get valueTransferred(): BigInt | null {
    let value = this.get("valueTransferred");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set valueTransferred(value: BigInt | null) {
    if (!value) {
      this.unset("valueTransferred");
    } else {
      this.set("valueTransferred", Value.fromBigInt(<BigInt>value));
    }
  }

  get gasUsed(): BigInt | null {
    let value = this.get("gasUsed");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set gasUsed(value: BigInt | null) {
    if (!value) {
      this.unset("gasUsed");
    } else {
      this.set("gasUsed", Value.fromBigInt(<BigInt>value));
    }
  }

  get gasPrice(): BigInt | null {
    let value = this.get("gasPrice");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set gasPrice(value: BigInt | null) {
    if (!value) {
      this.unset("gasPrice");
    } else {
      this.set("gasPrice", Value.fromBigInt(<BigInt>value));
    }
  }

  get blockTimestamp(): BigInt {
    let value = this.get("blockTimestamp");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set blockTimestamp(value: BigInt) {
    this.set("blockTimestamp", Value.fromBigInt(value));
  }

  get depositor(): Bytes {
    let value = this.get("depositor");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set depositor(value: Bytes) {
    this.set("depositor", Value.fromBytes(value));
  }

  get depositReceiver(): Bytes {
    let value = this.get("depositReceiver");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set depositReceiver(value: Bytes) {
    this.set("depositReceiver", Value.fromBytes(value));
  }

  get rootToken(): Bytes {
    let value = this.get("rootToken");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set rootToken(value: Bytes) {
    this.set("rootToken", Value.fromBytes(value));
  }

  get depositData(): Bytes {
    let value = this.get("depositData");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBytes();
    }
  }

  set depositData(value: Bytes) {
    this.set("depositData", Value.fromBytes(value));
  }
}
