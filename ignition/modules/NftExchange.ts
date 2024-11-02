import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const NftExchangeModule = buildModule('NftExchangeModule', (m) => {
    const nftExchange = m.contract('NftExchange', [])
    return { nftExchange }
})

export default NftExchangeModule
