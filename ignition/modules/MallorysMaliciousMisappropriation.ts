import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import NftInvestmentFundModule from './NftInvestmentFund'

const MallorysMaliciousMisappropriationModule = buildModule('MallorysMaliciousMisappropriationModule', (m) => {
    const { nftInvestmentFund } = m.useModule(NftInvestmentFundModule)

    const mallory = m.getAccount(4)
    const mallorysMaliciousMisappropriation = m.contract('MallorysMaliciousMisappropriation', [nftInvestmentFund], {
        from: mallory
    })
    return { mallorysMaliciousMisappropriation }
})

export default MallorysMaliciousMisappropriationModule
