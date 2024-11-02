import hre from 'hardhat'
import SystemModule from '../ignition/modules/System'
import { Deployment } from './cli'

export async function trentClosesFund(deployment?: Deployment) {
    const { nftInvestmentFund } = deployment ?? (await hre.ignition.deploy(SystemModule))
    await nftInvestmentFund.write.closeFund()
}

if (require.main === module) {
    trentClosesFund().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
