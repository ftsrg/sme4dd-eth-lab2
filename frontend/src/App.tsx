import { useEffect, useState } from 'react'
import { Message } from 'primereact/message'
import Loading from './components/Loading'
import { Chip } from 'primereact/chip'
import Nft from './components/Nft'
import Panel from './components/Panel'
import BalanceChip from './components/BalanceChip'
import StateColoredChip from './components/StateColoredChip'
import useNetwork from './hooks/useNetwork'
import useScenario from './hooks/useScenario'

enum AppState {
    INITIALIZING, // Loading
    WALLET_NOT_AVAILABLE, // There is no wallet installed
    USER_NOT_AVAILABLE, // The app is not allowed to access the wallet
    WRONG_NETWORK, // The factory is not deployed to the selected network
    INITIALIZED // Wallet is ready, network is OK
}

function App() {
    // The selected network
    const [network, networkLoading] = useNetwork()

    // The scenario
    const [scenario] = useScenario()

    // The state of the app
    const [state, setState] = useState(AppState.INITIALIZING)

    useEffect(() => {
        if (networkLoading) {
            setState(AppState.INITIALIZING)
        } else if (!window.ethereum) {
            setState(AppState.WALLET_NOT_AVAILABLE)
        } else if (network === null) {
            setState(AppState.WRONG_NETWORK)
        } else if (scenario === null) {
            setState(AppState.INITIALIZING)
        } else {
            setState(AppState.INITIALIZED)
        }
    }, [network, networkLoading, scenario])

    return (
        <div className="w-full p-3 mx-auto flex flex-column justify-content-start gap-4" style={{ maxWidth: '1260px' }}>
            {state === AppState.INITIALIZING && <Loading />}
            {state === AppState.WALLET_NOT_AVAILABLE && (
                <Message severity="error" text="There is no wallet available!" className="w-full" />
            )}
            {state === AppState.USER_NOT_AVAILABLE && (
                <Message
                    severity="error"
                    text="The selected wallet does not exist or this app does not have permission to access it!"
                    className="w-full"
                />
            )}
            {state === AppState.WRONG_NETWORK && (
                <Message severity="warn" text="The contracts are not deployed on this network!" className="w-full" />
            )}
            {state === AppState.INITIALIZED && network && scenario && (
                <>
                    <Panel
                        icon="pi-user"
                        title="Oscar"
                        chips={[
                            <Chip label={scenario.oscar.ethBalance.toFixed(2)} icon="pi pi-ethereum" />,
                            <BalanceChip current={scenario.oscar.ethBalance} base={10000} />
                        ]}
                    >
                        <div className="flex flex-wrap gap-3">
                            {scenario.oscar.nfts.map((nft, index) => (
                                <Nft nft={nft} key={index} />
                            ))}
                            {scenario.oscar.nfts.length === 0 && <span>No NFT is owned by Oscar</span>}
                        </div>
                    </Panel>
                    <Panel icon="pi-building" title="NFT Exchange">
                        <div className="flex flex-wrap gap-3">
                            {scenario.nftExchange.listings.map((listing, index) => (
                                <Nft
                                    nft={listing.nft}
                                    price={listing.price}
                                    seller={listing.seller}
                                    state={scenario.state}
                                    key={index}
                                />
                            ))}
                            {scenario.nftExchange.listings.length === 0 && <span>No active listing</span>}
                        </div>
                    </Panel>
                    <Panel
                        icon="pi-building-columns"
                        title="NFT Investment Fund"
                        chips={[
                            <Chip label={scenario.nftInvestmentFund.ethBalance.toFixed(2)} icon="pi pi-ethereum" />,
                            <Chip label={scenario.nftInvestmentFund.tokenSupply.toString()} icon="pi pi-circle-fill" />,
                            <StateColoredChip label={scenario.state} icon="pi pi-clock" state={scenario.state} />,
                            <BalanceChip
                                current={scenario.nftInvestmentFund.ethBalance}
                                base={scenario.nftInvestmentFund.baseEthBalance}
                            />
                        ]}
                    >
                        <div className="flex flex-wrap gap-3">
                            {scenario.nftInvestmentFund.nfts.map((nft, index) => (
                                <Nft nft={nft} key={index} />
                            ))}
                            {scenario.nftInvestmentFund.nfts.length === 0 && <span>No NFT in fund</span>}
                        </div>
                    </Panel>
                    <div className="w-full flex flex-wrap md:flex-nowrap gap-4">
                        {(['alice', 'bob', 'mallory'] as const).map((user) => (
                            <div className="flex-grow-1">
                                <Panel
                                    icon="pi-user"
                                    title={`${user.charAt(0).toUpperCase()}${user.substring(1)}`}
                                    chips={[
                                        <Chip label={scenario[user].ethBalance.toFixed(2)} icon="pi pi-ethereum" />,
                                        <Chip
                                            label={scenario[user].tokenBalance.toString()}
                                            icon="pi pi-circle-fill"
                                        />,
                                        <BalanceChip current={scenario[user].ethBalance} base={10000} />
                                    ]}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default App
