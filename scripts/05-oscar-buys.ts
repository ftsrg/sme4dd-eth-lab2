import hre from 'hardhat'
import { getContract } from 'viem'
import { confirm, select } from '@inquirer/prompts'
import SystemModule from '../ignition/modules/System'
import { Deployment } from './cli'

import { abi as ERC721$ABI } from '../artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721.json'
import { ERC721$Type } from '../artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721'

export async function oscarBuys(deployment?: Deployment) {
    const { nftExchange } = deployment ?? (await hre.ignition.deploy(SystemModule))
    const [, , , oscar] = await hre.viem.getWalletClients()

    let buyConfirm = true
    do {
        const numberOfListings = await nftExchange.read.numberOfListings({ account: oscar.account })
        const listings = [] as { listingId: bigint; nftName: string; nftTokenId: bigint; price: bigint }[]
        for (let i = 0; i < numberOfListings; i++) {
            const [listingId, nftContractAddress, nftTokenId, , price, isSold] = await nftExchange.read.listings(
                [BigInt(i)],
                { account: oscar.account }
            )
            if (!isSold) {
                const nftContract = getContract({
                    abi: ERC721$ABI as ERC721$Type['abi'],
                    address: nftContractAddress,
                    client: oscar
                })
                const nftName = await nftContract.read.name({ account: oscar.account })
                listings.push({ listingId, nftName, nftTokenId, price })
            }
        }

        if (listings.length === 0) {
            break
        }

        buyConfirm = await confirm({
            message: `Does Oscar want to buy NFTs?`,
            default: true
        })

        if (buyConfirm) {
            const listing = await select({
                message: 'Which one does he want to buy?',
                choices: listings.map((listing) => ({
                    name: `${listing.nftName} (#${listing.nftTokenId})`,
                    value: listing
                }))
            })

            await nftExchange.write.buyNFT([listing.listingId], { account: oscar.account, value: listing.price })
        }
    } while (buyConfirm)
}

if (require.main === module) {
    oscarBuys().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
