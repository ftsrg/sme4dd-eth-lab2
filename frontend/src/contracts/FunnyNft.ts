import Contract from '../../../artifacts/contracts/FunnyNft.sol/FunnyNft.json'
type ContractType = import('../../../artifacts/contracts/FunnyNft.sol/FunnyNft').FunnyNft$Type

export const FunnyNft = Contract as ContractType
