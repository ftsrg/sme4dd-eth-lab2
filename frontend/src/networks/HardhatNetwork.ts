import { hardhat } from 'viem/chains'
import HardhatDeployedAddressses from '../../../ignition/deployments/chain-31337/deployed_addresses.json'
import { getDeploymentAddress, INetwork } from './Deployment'

export const HardhatNetwork: INetwork = {
    addresses: {
        funnyNft: getDeploymentAddress(HardhatDeployedAddressses, 'FunnyNftModule#FunnyNft'),
        uniqueNft: getDeploymentAddress(HardhatDeployedAddressses, 'UniqueNftModule#UniqueNft'),
        nftExchange: getDeploymentAddress(HardhatDeployedAddressses, 'NftExchangeModule#NftExchange'),
        nftInvestmentFund: getDeploymentAddress(HardhatDeployedAddressses, 'NftInvestmentFundModule#NftInvestmentFund')
    },
    accounts: {
        alice: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        bob: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        oscar: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        mallory: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        trent: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    },
    chain: hardhat
}
