import { Address, Chain } from 'viem'

export interface INetwork {
    addresses: {
        funnyNft: Address
        uniqueNft: Address
        nftExchange: Address
        nftInvestmentFund: Address
    }
    accounts: {
        alice: Address
        bob: Address
        oscar: Address
        mallory: Address
        trent: Address
    }
    chain: Chain
}

export function getDeploymentAddress<T extends { [key: string]: string }, K extends keyof T>(
    addresses: T,
    key: K
): Address
export function getDeploymentAddress<T extends { [key: string]: string }, K extends string>(
    addresses: T,
    key: K
): Address
export function getDeploymentAddress<T extends { [key: string]: string }, K extends string>(
    addresses: T,
    key: K
): Address {
    if (key in addresses) {
        const address = addresses[key]
        if (address.startsWith('0x')) {
            return address as Address
        } else {
            throw new Error('Invalid address')
        }
    } else {
        return '0x0'
    }
}
