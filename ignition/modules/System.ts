import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import NftInvestmentFundModule from './NftInvestmentFund'
import UniqueNftModule from './UniqueNft'
import FunnyNftModule from './FunnyNft'
import NftExchangeModule from './NftExchange'
import MallorysMaliciousMisappropriationModule from './MallorysMaliciousMisappropriation'

const SystemModule = buildModule('SystemModule', (m) => {
    const { uniqueNft } = m.useModule(UniqueNftModule)
    const { funnyNft } = m.useModule(FunnyNftModule)
    const { nftExchange } = m.useModule(NftExchangeModule)
    const { nftInvestmentFund } = m.useModule(NftInvestmentFundModule)
    const { mallorysMaliciousMisappropriation } = m.useModule(MallorysMaliciousMisappropriationModule)

    return { uniqueNft, funnyNft, nftExchange, nftInvestmentFund, mallorysMaliciousMisappropriation }
})

export default SystemModule
