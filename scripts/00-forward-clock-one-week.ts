import { network } from 'hardhat'

export async function forwardClock() {
    await network.provider.send('evm_increaseTime', [60 * 60 * 24 * 7])
    await network.provider.send('evm_mine')
}

if (require.main === module) {
    forwardClock().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
