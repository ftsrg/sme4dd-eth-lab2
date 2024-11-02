import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import { parseEther } from 'viem'

const NftInvestmentFundModule = buildModule('NftInvestmentFundModule', (m) => {
    const oneWeekFromNow = new Date()
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
    const twoWeeksFromNow = new Date()
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)

    const name = m.getParameter('name', 'Investment Fund')
    const symbol = m.getParameter('symbol', 'IFT')
    const pricePerToken = m.getParameter('pricePerToken', parseEther('100'))
    const fundingEnd = m.getParameter('fundingEnd', Math.floor(oneWeekFromNow.getTime() / 1000))
    const investmentEnd = m.getParameter('investmentEnd', Math.floor(twoWeeksFromNow.getTime() / 1000))

    const nftInvestmentFund = m.contract('NftInvestmentFund', [name, symbol, pricePerToken, fundingEnd, investmentEnd])
    return { nftInvestmentFund }
})

export default NftInvestmentFundModule
