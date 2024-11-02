import hre from 'hardhat'
import { parseEther, getContract, Address } from 'viem'
import { confirm, number, select } from '@inquirer/prompts'
import SystemModule from '../ignition/modules/System'
import { Deployment } from './cli'

import { abi as ERC721$ABI } from '../artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721.json'
import { ERC721$Type } from '../artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721'

export async function trentSells(deployment?: Deployment) {
    const { uniqueNft, nftExchange, nftInvestmentFund } = deployment ?? (await hre.ignition.deploy(SystemModule))

    const [trent] = await hre.viem.getWalletClients()

    let sellConfirm = true
    do {
        const ownedNftAddressesCount = await nftInvestmentFund.read.ownedNftAddressesCount()
        const ownedNfts = [] as {
            nftAddress: Address
            nftTokenIndex: number
            nftTokenId: bigint
            nftName: string
            suggestedPrice: number
        }[]
        const uniqueNftSymbol = await uniqueNft.read.symbol()

        for (let i = 0; i < ownedNftAddressesCount; i++) {
            const ownedNftAddress = await nftInvestmentFund.read.ownedNftAddresses([BigInt(i)])
            const ownedNftTokenIdsCount = await nftInvestmentFund.read.ownedNftTokenIdsCount([ownedNftAddress])

            const nftContract = getContract({
                abi: ERC721$ABI as ERC721$Type['abi'],
                address: ownedNftAddress,
                client: trent
            })
            const nftName = await nftContract.read.name()
            const nftSymbol = await nftContract.read.symbol()

            for (let j = 0; j < ownedNftTokenIdsCount; j++) {
                const nftTokenId = await nftInvestmentFund.read.ownedNftTokenIds([ownedNftAddress, BigInt(j)])
                ownedNfts.push({
                    nftAddress: ownedNftAddress,
                    nftTokenIndex: j,
                    nftTokenId,
                    nftName,
                    suggestedPrice: nftSymbol === uniqueNftSymbol ? 8000 : 2000
                })
            }
        }

        if (ownedNfts.length === 0) {
            break
        }

        sellConfirm = await confirm({
            message: `The fund has ${ownedNfts.length} NFTs. Does Trent want to sell any of them?`,
            default: true
        })

        if (sellConfirm) {
            const ownedNft = await select({
                message: 'Which one does he want to sell?',
                choices: ownedNfts.map((ownedNft) => ({
                    name: `${ownedNft.nftName} (#${ownedNft.nftTokenId})`,
                    value: ownedNft
                }))
            })
            const price = await number({
                message: 'How much does he want to charge for it?',
                min: 0,
                default: ownedNft.suggestedPrice
            })

            await nftInvestmentFund.write.sellNFT([
                nftExchange.address,
                ownedNft.nftAddress,
                BigInt(ownedNft.nftTokenIndex),
                parseEther(price?.toString() ?? '2000')
            ])
        }
    } while (sellConfirm)
}

if (require.main === module) {
    trentSells().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
