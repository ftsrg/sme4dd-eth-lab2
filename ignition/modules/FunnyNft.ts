import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const FunnyNftModule = buildModule('FunnyNftModule', (m) => {
    const oscar = m.getAccount(3)
    const funnyNft = m.contract('FunnyNft', [], { from: oscar })
    return { funnyNft }
})

export default FunnyNftModule
