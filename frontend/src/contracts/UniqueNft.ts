import Contract from '../../../artifacts/contracts/UniqueNft.sol/UniqueNft.json'
type ContractType = import('../../../artifacts/contracts/UniqueNft.sol/UniqueNft').UniqueNft$Type

export const UniqueNft = Contract as ContractType
