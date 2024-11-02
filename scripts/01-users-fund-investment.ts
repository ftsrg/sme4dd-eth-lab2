import hre from 'hardhat'
import { formatEther, parseEther } from 'viem'
import { confirm, number } from '@inquirer/prompts'
import SystemModule from '../ignition/modules/System'
import { Deployment } from './cli'

export async function usersFund(deployment?: Deployment) {
    const { nftInvestmentFund } = deployment ?? (await hre.ignition.deploy(SystemModule))
    const [, alice, bob, , mallory] = await hre.viem.getWalletClients()

    const pricePerToken = parseInt(formatEther(await nftInvestmentFund.read.pricePerToken()))

    const users = [
        { name: 'Alice', client: alice, defaultInvest: 5000 },
        { name: 'Bob', client: bob, defaultInvest: 3000 },
        { name: 'Mallory', client: mallory, defaultInvest: 2000 }
    ]

    for (const user of users) {
        const userWantsToFund = await confirm({ message: `Does ${user.name} want to invest?`, default: true })
        if (userWantsToFund) {
            const price = await number({
                message: `How much do they want to invest? Price per token: ${pricePerToken}`,
                min: 0,
                default: user.defaultInvest,
                required: false,
                validate: (value) => (value ? Number.isInteger((value ?? user.defaultInvest) / pricePerToken) : true)
            })

            await nftInvestmentFund.write.invest([BigInt((price ?? user.defaultInvest) / pricePerToken)], {
                account: user.client.account,
                value: parseEther((price ?? user.defaultInvest).toString())
            })
        }
    }
}

if (require.main === module) {
    usersFund().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
