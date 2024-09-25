import { Address } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";


export class EigenLayerEthereumConfigurations implements Configurations {
  getNetwork(): string {
    return "MAINNET";
  }
  getProtocolName(): string {
    return "Eigen Layer";
  }
  getProtocolSlug(): string {
    return "eigenlayer";
  }
  getFactoryAddress(): Address {
    return Address.fromString("0x369e6f597e22eab55ffb173c6d9cd234bd699111");
  }
}
