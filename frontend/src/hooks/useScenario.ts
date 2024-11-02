import { useCallback, useEffect, useState } from 'react'
import { Address, createPublicClient, custom, getContract, getAddress, formatEther } from 'viem'
import { NFT, Listing } from '../components/Nft'
import { ERC721 } from '../contracts/ERC721'
import { FundToken } from '../contracts/FundToken'
import { FunnyNft } from '../contracts/FunnyNft'
import { NftExchange } from '../contracts/NftExchange'
import { NftInvestmentFund } from '../contracts/NftInvestmentFund'
import { UniqueNft } from '../contracts/UniqueNft'
import useNetwork from './useNetwork'

type Scenario = {
    state: 'fund' | 'invest' | 'withdraw' | 'waiting'
    alice: {
        ethBalance: number
        tokenBalance: number
    }
    bob: {
        ethBalance: number
        tokenBalance: number
    }
    mallory: {
        ethBalance: number
        tokenBalance: number
    }
    oscar: {
        ethBalance: number
        nfts: NFT[]
    }
    nftInvestmentFund: {
        ethBalance: number
        baseEthBalance: number
        tokenSupply: number
        nfts: NFT[]
    }
    nftExchange: {
        listings: Listing[]
    }
}

export default function useScenario() {
    const [network] = useNetwork()
    const [scenario, setScenario] = useState(null as Scenario | null)
    const [loading, setLoading] = useState(true)

    const loadNft = useCallback(async (nftAddress: Address, nftTokenId: number) => {
        const publicClient = createPublicClient({ transport: custom(window.ethereum!) })

        const nftContract = getContract({
            abi: ERC721.abi,
            address: nftAddress,
            client: publicClient
        })

        const name = await nftContract.read.name()

        try {
            const tokenURI = await nftContract.read.tokenURI([BigInt(nftTokenId)])
            const response = await fetch(tokenURI)
            const { description, image } = await response.json()

            return { name, tokenId: nftTokenId, description, imageUrl: image }
        } catch (e) {
            console.log(e)
            return { name, tokenId: nftTokenId }
        }
    }, [])

    const loadState = useCallback(async () => {
        setLoading(true)
        if (!network) {
            setScenario(null)
            setLoading(false)
            return
        }

        const publicClient = createPublicClient({ transport: custom(window.ethereum!) })
        const nftInvestmentFund = getContract({
            abi: NftInvestmentFund.abi,
            address: network.addresses.nftInvestmentFund,
            client: publicClient
        })
        const nftExchange = getContract({
            abi: NftExchange.abi,
            address: network.addresses.nftExchange,
            client: publicClient
        })
        const fundToken = getContract({
            abi: FundToken.abi,
            address: await nftInvestmentFund.read.fundToken(),
            client: publicClient
        })
        const uniqueNft = getContract({
            abi: UniqueNft.abi,
            address: network.addresses.uniqueNft,
            client: publicClient
        })
        const funnyNft = getContract({
            abi: FunnyNft.abi,
            address: network.addresses.funnyNft,
            client: publicClient
        })

        // State
        const now = new Date(Number((await publicClient.getBlock()).timestamp) * 1000)
        const fundingEnd = new Date(Number(await nftInvestmentFund.read.fundingEnd()) * 1000)
        const investmentEnd = new Date(Number(await nftInvestmentFund.read.investmentEnd()) * 1000)
        const ended = await nftInvestmentFund.read.ended()
        const state = now < fundingEnd ? 'fund' : now < investmentEnd ? 'invest' : ended ? 'withdraw' : 'waiting'

        // ETH balances
        const aliceEthBalance = await publicClient.getBalance({ address: network.accounts.alice })
        const bobEthBalance = await publicClient.getBalance({ address: network.accounts.bob })
        const oscarEthBalance = await publicClient.getBalance({ address: network.accounts.oscar })
        const malloryEthBalance = await publicClient.getBalance({ address: network.accounts.mallory })
        const nftInvestnemtFundEthBalance = await publicClient.getBalance({
            address: network.addresses.nftInvestmentFund
        })

        // Token balances
        const aliceTokenBalance = await fundToken.read.balanceOf([network.accounts.alice])
        const bobTokenBalance = await fundToken.read.balanceOf([network.accounts.bob])
        const malloryTokenBalance = await fundToken.read.balanceOf([network.accounts.mallory])
        const nftInvestmentFundTokenSupply = await fundToken.read.totalSupply()

        // NFTs
        const oscarNFTs = [] as NFT[]
        const investmentFundNFTs = [] as NFT[]

        const uniqueNftOwner = await uniqueNft.read.ownerOf([0n])
        if (uniqueNftOwner === getAddress(network.accounts.oscar)) {
            oscarNFTs.push(await loadNft(uniqueNft.address, 0))
        } else if (uniqueNftOwner === getAddress(network.addresses.nftInvestmentFund)) {
            investmentFundNFTs.push(await loadNft(uniqueNft.address, 0))
        }

        const funnyNftTotalSupply = await funnyNft.read.totalSupply()
        for (let i = 0; i < funnyNftTotalSupply; i++) {
            const funnyNftOwner = await funnyNft.read.ownerOf([BigInt(i)])
            if (funnyNftOwner === getAddress(network.accounts.oscar)) {
                oscarNFTs.push(await loadNft(funnyNft.address, i))
            } else if (funnyNftOwner === getAddress(network.addresses.nftInvestmentFund)) {
                investmentFundNFTs.push(await loadNft(funnyNft.address, i))
            }
        }

        // Exchange
        const listingsCount = await nftExchange.read.numberOfListings()
        const listings = [] as Listing[]
        for (let i = 0; i < listingsCount; i++) {
            const [, nftContractAddress, nftTokenId, seller, price, isSold] = await nftExchange.read.listings([
                BigInt(i)
            ])
            if (isSold) {
                continue
            }

            listings.push({
                nft: await loadNft(nftContractAddress, Number(nftTokenId)),
                price: parseFloat(formatEther(price)),
                seller:
                    seller === getAddress(network.accounts.oscar)
                        ? 'oscar'
                        : seller === getAddress(network.addresses.nftInvestmentFund)
                          ? 'nftInvestmentFund'
                          : 'unknown'
            })
        }

        setScenario({
            state: state,
            alice: {
                ethBalance: parseFloat(formatEther(aliceEthBalance)),
                tokenBalance: Number(aliceTokenBalance)
            },
            bob: {
                ethBalance: parseFloat(formatEther(bobEthBalance)),
                tokenBalance: Number(bobTokenBalance)
            },
            mallory: {
                ethBalance: parseFloat(formatEther(malloryEthBalance)),
                tokenBalance: Number(malloryTokenBalance)
            },
            oscar: {
                ethBalance: parseFloat(formatEther(oscarEthBalance)),
                nfts: oscarNFTs
            },
            nftInvestmentFund: {
                ethBalance: parseFloat(formatEther(nftInvestnemtFundEthBalance)),
                baseEthBalance: parseFloat(
                    formatEther(nftInvestmentFundTokenSupply * (await nftInvestmentFund.read.pricePerToken()))
                ),
                tokenSupply: Number(nftInvestmentFundTokenSupply),
                nfts: investmentFundNFTs
            },
            nftExchange: {
                listings: listings
            }
        })
        setLoading(false)
    }, [loadNft, network])

    useEffect(() => {
        loadState()
    }, [loadState, network])

    useEffect(() => {
        if (!network) {
            return
        }

        const publicClient = createPublicClient({
            chain: network.chain,
            transport: custom(window.ethereum!)
        })

        const unwatch = publicClient.watchBlocks({
            onBlock: loadState
        })

        return () => {
            unwatch()
        }
    }, [loadState, network])

    return [scenario, loading] as const
}
