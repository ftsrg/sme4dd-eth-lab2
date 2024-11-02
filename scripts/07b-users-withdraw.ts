import hre from 'hardhat'
import { formatEther, getContract } from 'viem'
import { confirm } from '@inquirer/prompts'
import SystemModule from '../ignition/modules/System'
import { Deployment } from './cli'

import { abi as FundToken$ABI } from '../artifacts/contracts/FundToken.sol/FundToken.json'
import { FundToken$Type } from '../artifacts/contracts/FundToken.sol/FundToken'

export async function usersWithdraw(deployment?: Deployment) {
    const { nftInvestmentFund } = deployment ?? (await hre.ignition.deploy(SystemModule))

    const publicClient = await hre.viem.getPublicClient()
    const [, alice, bob, , mallory] = await hre.viem.getWalletClients()

    const users = [
        { name: 'Alice', client: alice },
        { name: 'Bob', client: bob },
        { name: 'Mallory', client: mallory }
    ]

    for (const user of users) {
        const userWantsToWithdraw = await confirm({ message: `Does ${user.name} want to withdraw?`, default: true })
        if (userWantsToWithdraw) {
            const fundContract = getContract({
                abi: FundToken$ABI as FundToken$Type['abi'],
                address: await nftInvestmentFund.read.fundToken(),
                client: user.client
            })
            await fundContract.write.approve(
                [nftInvestmentFund.address, await fundContract.read.balanceOf([user.client.account.address])],
                { account: user.client.account }
            )
            await nftInvestmentFund.write.withdraw({ account: user.client.account })
        }
    }

    console.log(
        `NftInvestmentFund: ${formatEther(await publicClient.getBalance({ address: nftInvestmentFund.address }))}`
    )
    console.log(`Alice: ${formatEther(await publicClient.getBalance({ address: alice.account.address }))}`)
    console.log(`Bob: ${formatEther(await publicClient.getBalance({ address: bob.account.address }))}`)
    console.log(`Mallory: ${formatEther(await publicClient.getBalance({ address: mallory.account.address }))}`)
}

if (require.main === module) {
    usersWithdraw().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
