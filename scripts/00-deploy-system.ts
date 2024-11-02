import hre from 'hardhat'
import { getAddress } from 'viem'
import { number } from '@inquirer/prompts'
import SystemModule from '../ignition/modules/System'
import fs from 'node:fs'
import { join } from 'node:path'

export async function deploySystem() {
    if (['hardhat', 'localhost'].includes(hre.network.name)) {
        await hre.network.provider.send('hardhat_reset')

        if (hre.network.name === 'localhost') {
            fs.promises.rm(join(__dirname, '../ignition/deployments/chain-31337'), { force: true, recursive: true })
        }
    }

    const deployment = await hre.ignition.deploy(SystemModule)
    const { uniqueNft, funnyNft, nftExchange, nftInvestmentFund } = deployment
    const [, , , oscar] = await hre.viem.getWalletClients()

    console.log(`UniqueNft: ${uniqueNft.address}`)
    console.log(`FunnyNft: ${funnyNft.address}`)
    console.log(`NftExchange: ${nftExchange.address}`)
    console.log(`NftInvestmentFund: ${nftInvestmentFund.address}`)

    const nftsToMint = await number({ message: 'How many funny NFTs to mint?', min: 0, default: 3 })
    for (let i = 0; nftsToMint && i < nftsToMint; i++) {
        await funnyNft.write.safeMint([getAddress(oscar.account.address)], { account: oscar.account })
    }

    return deployment
}

if (require.main === module) {
    deploySystem().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
