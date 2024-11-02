import hre from 'hardhat'
import {
    Account,
    Address,
    BaseError,
    Chain,
    ContractFunctionRevertedError,
    getAddress,
    GetContractReturnType,
    InsufficientFundsError,
    parseEther,
    RpcSchema,
    Transport,
    UserRejectedRequestError,
    WalletClient
} from 'viem'
import { UniqueNft$Type } from '../artifacts/contracts/UniqueNft.sol/UniqueNft'
import { FunnyNft$Type } from '../artifacts/contracts/FunnyNft.sol/FunnyNft'
import { NftExchange$Type } from '../artifacts/contracts/NftExchange.sol/NftExchange'
import { NftInvestmentFund$Type } from '../artifacts/contracts/NftInvestmentFund.sol/NftInvestmentFund'

import { confirm, number, select } from '@inquirer/prompts'
import colors from 'yoctocolors-cjs'
import { deploySystem } from './00-deploy-system'
import { forwardClock } from './00-forward-clock-one-week'
import { usersFund } from './01-users-fund-investment'
import { oscarSells } from './02-oscar-sells'
import { trentBuys } from './03-trent-buys'
import { trentSells } from './04-trent-sells'
import { oscarBuys } from './05-oscar-buys'
import { usersWithdraw } from './07b-users-withdraw'
import { trentClosesFund } from './06-trent-closes-fund'
import { MallorysMaliciousMisappropriation$Type } from '../artifacts/contracts/MallorysMaliciousMisappropriation.sol/MallorysMaliciousMisappropriation'
import { malloryAttacks } from './07a-mallory-attacks'

enum Command {
    DEPLOY_SYSTEM,
    FORWARD_CLOCK_ONE_WEEK_1,
    USERS_FUND,
    OSCAR_SELLS,
    TRENT_BUYS,
    TRENT_SELLS,
    OSCAR_BUYS,
    FORWARD_CLOCK_ONE_WEEK_2,
    TRENT_CLOSES_FUND,
    MALLORY_ATTACKS,
    USERS_WITHDRAW,
    EXIT
}

export type Deployment = {
    uniqueNft: GetContractReturnType<UniqueNft$Type['abi'], WalletClient<Transport, Chain, Account, RpcSchema>, Address>
    funnyNft: GetContractReturnType<FunnyNft$Type['abi'], WalletClient<Transport, Chain, Account, RpcSchema>, Address>
    nftExchange: GetContractReturnType<
        NftExchange$Type['abi'],
        WalletClient<Transport, Chain, Account, RpcSchema>,
        Address
    >
    nftInvestmentFund: GetContractReturnType<
        NftInvestmentFund$Type['abi'],
        WalletClient<Transport, Chain, Account, RpcSchema>,
        Address
    >
    mallorysMaliciousMisappropriation: GetContractReturnType<
        MallorysMaliciousMisappropriation$Type['abi'],
        WalletClient<Transport, Chain, Account, RpcSchema>,
        Address
    >
}

async function main() {
    let deployment = await deploySystem()
    let lastCommand = Command.USERS_FUND
    while (true) {
        lastCommand = await select({
            message: 'Choose command',
            choices: [
                { value: Command.DEPLOY_SYSTEM, name: '[  meta  ] Deploy system' },
                { value: Command.EXIT, name: '[  meta  ] Exit' },
                { type: 'separator', separator: '----------------------------------' },
                { value: Command.USERS_FUND, name: '[  fund  ] Users fund investment' },
                { value: Command.FORWARD_CLOCK_ONE_WEEK_1, name: '[  fund  ] Forward clock' },
                { type: 'separator', separator: '----------------------------------' },
                { value: Command.OSCAR_SELLS, name: '[ invest ] Oscar sells NFTs' },
                { value: Command.TRENT_BUYS, name: '[ invest ] Trent buys NFTs' },
                { value: Command.TRENT_SELLS, name: '[ invest ] Trent sells NFTs' },
                { value: Command.OSCAR_BUYS, name: '[ invest ] Oscar buys NFTs' },
                { value: Command.FORWARD_CLOCK_ONE_WEEK_2, name: '[ invest ] Forward clock' },
                { type: 'separator', separator: '----------------------------------' },
                { value: Command.TRENT_CLOSES_FUND, name: '[withdraw] Trent closes fund' },
                { value: Command.MALLORY_ATTACKS, name: `[withdraw] ${colors.bold(`!!! Mallory attacks !!!`)}` },
                { value: Command.USERS_WITHDRAW, name: '[withdraw] Users withdraw' }
            ],
            default: lastCommand,
            pageSize: 15,
            theme: {
                style: {
                    highlight: (text: string) => {
                        return colors[
                            text.includes('[  meta  ]')
                                ? 'red'
                                : text.includes('[  fund  ]')
                                  ? 'yellow'
                                  : text.includes('[withdraw]')
                                    ? 'green'
                                    : 'cyan'
                        ](text)
                    },
                    answer: (text: string) => {
                        return colors[
                            text.includes('[  meta  ]')
                                ? 'red'
                                : text.includes('[  fund  ]')
                                  ? 'yellow'
                                  : text.includes('[withdraw]')
                                    ? 'green'
                                    : 'cyan'
                        ](text)
                    }
                }
            }
        })

        try {
            switch (lastCommand) {
                case Command.DEPLOY_SYSTEM:
                    deployment = await deploySystem()
                    break
                case Command.EXIT:
                    process.exit(0)
                case Command.FORWARD_CLOCK_ONE_WEEK_1:
                case Command.FORWARD_CLOCK_ONE_WEEK_2:
                    await forwardClock()
                    break
                case Command.USERS_FUND:
                    await usersFund(deployment)
                    break
                case Command.OSCAR_SELLS:
                    await oscarSells(deployment)
                    break
                case Command.TRENT_BUYS:
                    await trentBuys(deployment)
                    break
                case Command.TRENT_SELLS:
                    await trentSells(deployment)
                    break
                case Command.OSCAR_BUYS:
                    await oscarBuys(deployment)
                    break
                case Command.TRENT_CLOSES_FUND:
                    await trentClosesFund(deployment)
                    break
                case Command.MALLORY_ATTACKS:
                    await malloryAttacks(deployment)
                    break
                case Command.USERS_WITHDRAW:
                    await usersWithdraw(deployment)
                    break
            }
        } catch (error) {
            if (error instanceof BaseError) {
                const revertError = error.walk((err) => err instanceof ContractFunctionRevertedError)
                const insufficientFundsError = error.walk((e) => e instanceof InsufficientFundsError)

                if (revertError instanceof ContractFunctionRevertedError) {
                    const errorName = revertError.reason ?? ''
                    console.error(colors.red(`Error: ${errorName}`))
                    console.log(revertError)
                } else if (insufficientFundsError instanceof InsufficientFundsError) {
                    console.error(colors.red(`Error: Insufficient funds`))
                } else {
                    console.error(colors.red(`Error: Unknown error`))
                }
            } else {
                console.error(error)
            }
        }
    }
}

main().catch((e) => {
    console.error(e)
    process.exitCode = 1
})
