import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

const UniqueNftModule = buildModule('UniqueNftModule', (m) => {
    const oscar = m.getAccount(3)
    const uniqueNft = m.contract('UniqueNft', [], { from: oscar })
    return { uniqueNft }
})

export default UniqueNftModule
