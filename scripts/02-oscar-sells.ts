import hre from 'hardhat'
import { getAddress, parseEther } from 'viem'
import { confirm, number, select } from '@inquirer/prompts'
import SystemModule from '../ignition/modules/System'
import { Deployment } from './cli'

export async function oscarSells(deployment?: Deployment) {
    const { uniqueNft, funnyNft, nftExchange } = deployment ?? (await hre.ignition.deploy(SystemModule))

    const [, , , oscar] = await hre.viem.getWalletClients()

    const uniqueNftOwner = await uniqueNft.read.ownerOf([0n])
    if (uniqueNftOwner === getAddress(oscar.account.address)) {
        const uniqueSellConfirm = await confirm({ message: 'Does Oscar want to sell his unique NFT', default: true })
        if (uniqueSellConfirm) {
            const price = await number({ message: 'How much does he want to charge for it?', min: 0, default: 4000 })
            await uniqueNft.write.approve([nftExchange.address, 0n], { account: oscar.account })
            await nftExchange.write.sellNFT([uniqueNft.address, 0n, parseEther(price?.toString() ?? '4000')], {
                account: oscar.account
            })
        }
    }

    let funnySellConfirm = true
    do {
        const funnyNftBalance = await funnyNft.read.balanceOf([oscar.account.address])
        const funnyNftTokenIds = [] as bigint[]
        for (let i = 0; i < funnyNftBalance; i++) {
            funnyNftTokenIds.push(await funnyNft.read.tokenOfOwnerByIndex([oscar.account.address, BigInt(i)]))
        }

        if (funnyNftBalance === 0n) {
            break
        }

        funnySellConfirm = await confirm({
            message: `Oscar has ${funnyNftBalance} funny NFTs. Does he want to sell any of them?`,
            default: true
        })

        if (funnySellConfirm) {
            const tokenId = await select({
                message: 'Which one does he want to sell?',
                choices: funnyNftTokenIds.map((funnyNftTokenId) => ({
                    name: funnyNftTokenId.toString(),
                    value: funnyNftTokenId
                }))
            })
            const price = await number({ message: 'How much does he want to charge for it?', min: 0, default: 1000 })

            await funnyNft.write.approve([nftExchange.address, tokenId], { account: oscar.account })
            await nftExchange.write.sellNFT([funnyNft.address, tokenId, parseEther(price?.toString() ?? '1000')], {
                account: oscar.account
            })
        }
    } while (funnySellConfirm)
}

if (require.main === module) {
    oscarSells().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
