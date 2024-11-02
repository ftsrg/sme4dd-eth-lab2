import hre from 'hardhat'
import { formatEther, getContract, parseEther } from 'viem'
import { confirm, number } from '@inquirer/prompts'
import SystemModule from '../ignition/modules/System'
import { Deployment } from './cli'

import { abi as FundToken$ABI } from '../artifacts/contracts/FundToken.sol/FundToken.json'
import { FundToken$Type } from '../artifacts/contracts/FundToken.sol/FundToken'

export async function malloryAttacks(deployment?: Deployment) {
    const { nftInvestmentFund, mallorysMaliciousMisappropriation } =
        deployment ?? (await hre.ignition.deploy(SystemModule))

    const publicClient = await hre.viem.getPublicClient()
    const [, , , , mallory] = await hre.viem.getWalletClients()

    const fundContract = getContract({
        abi: FundToken$ABI as FundToken$Type['abi'],
        address: await nftInvestmentFund.read.fundToken(),
        client: mallory
    })

    await fundContract.write.transfer(
        [mallorysMaliciousMisappropriation.address, await fundContract.read.balanceOf([mallory.account.address])],
        {
            account: mallory.account
        }
    )

    await mallorysMaliciousMisappropriation.write.attack({ account: mallory.account })
    await mallorysMaliciousMisappropriation.write.withdraw({ account: mallory.account })

    console.log(
        `NftInvestmentFund: ${formatEther(await publicClient.getBalance({ address: nftInvestmentFund.address }))}`
    )
    console.log(`Mallory: ${formatEther(await publicClient.getBalance({ address: mallory.account.address }))}`)
}

if (require.main === module) {
    malloryAttacks().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
