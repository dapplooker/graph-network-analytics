import {
    AVSMetadataURIUpdated as AVSMetadataURIUpdatedEvent,
    OperatorAVSRegistrationStatusUpdated as OperatorAVSRegistrationStatusUpdatedEvent
} from "../generated/AVSDirectory/AVSDirectory"
import {
    AVSDetails,
    OperatorAVSRelation
} from "../generated/schema"
import { Bytes } from "@graphprotocol/graph-ts";


export function handleAVSMetadataURIUpdated(event: AVSMetadataURIUpdatedEvent): void {
    let avsDetails = AVSDetails.load(event.params.avs);

    if (!avsDetails) {
        avsDetails = new AVSDetails(event.params.avs)
    }
    avsDetails.avs = event.params.avs
    avsDetails.metadataURI = event.params.metadataURI

    avsDetails.blockNumber = event.block.number
    avsDetails.blockTimestamp = event.block.timestamp
    if (event.transaction) {
        avsDetails.transactionHash = event.transaction.hash
    }

    avsDetails.save()
}


export function handleOperatorAVSRegistrationStatusUpdated(event: OperatorAVSRegistrationStatusUpdatedEvent): void {
    let operatorAVSRelation = OperatorAVSRelation.load(Bytes.fromHexString(event.params.operator.toHexString().concat(event.params.avs.toHexString())));

    if (!operatorAVSRelation) {
        operatorAVSRelation = new OperatorAVSRelation(Bytes.fromHexString(event.params.operator.toHexString().concat(event.params.avs.toHexString())))
    }

    operatorAVSRelation.operator = event.params.operator
    operatorAVSRelation.avs = event.params.avs
    operatorAVSRelation.status = event.params.status

    operatorAVSRelation.blockNumber = event.block.number
    operatorAVSRelation.blockTimestamp = event.block.timestamp
    if (event.transaction) {
        operatorAVSRelation.transactionHash = event.transaction.hash
    }

    operatorAVSRelation.save()
}
