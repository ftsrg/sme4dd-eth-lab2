import { Card } from 'primereact/card'
import { Chip } from 'primereact/chip'
import { classNames } from 'primereact/utils'
import { Image } from 'primereact/image'
import StateColoredChip from './StateColoredChip'

export type NFT = {
    name: string
    tokenId: number
    imageUrl?: string
    description?: string
}

export type Listing = {
    nft: NFT
    price: number
    seller: 'oscar' | 'nftInvestmentFund' | 'unknown'
}

type Props = {
    nft: NFT
    price?: number
    seller?: Listing['seller']
    state?: 'fund' | 'invest' | 'withdraw' | 'waiting'
}

function Nft({ nft, price, seller, state }: Props) {
    return (
        <Card
            title={`${nft.name} (#${nft.tokenId})`}
            header={<Image src={nft.imageUrl} title={nft.description} preview className="w-12rem min-w-full" />}
            className="w-max"
            style={{
                backgroundColor: 'lightgray',
                boxShadow:
                    '0 2px 1px -1px rgba(0, 0, 0, 0.2) inset, 0 1px 1px 0 rgba(0, 0, 0, 0.14) inset, 0 1px 3px 0 rgba(0, 0, 0, 0.12) inset'
            }}
            pt={{
                root: { className: classNames('flex', 'flex-column', 'justify-content-between') },
                title: { className: classNames('mb-0', 'text-lg') },
                body: { className: classNames('py-2', 'px-3') },
                content: { className: classNames(price && seller ? 'py-2' : 'p-0') }
            }}
        >
            <div className="flex gap-2">
                {price && <Chip label={price.toFixed(2)} icon="pi pi-ethereum" className="bg-white shadow-1" />}
                {seller && state && (
                    <StateColoredChip
                        label={seller === 'oscar' ? 'Oscar' : seller === 'nftInvestmentFund' ? 'Fund' : '????'}
                        icon={`pi ${seller === 'nftInvestmentFund' ? 'pi-building-columns' : 'pi-user'}`}
                        state={state}
                        className={classNames(
                            'shadow-1',
                            seller === 'oscar' ? 'bg-white' : seller === 'unknown' ? 'bg-red-500' : '',
                            seller === 'oscar' ? 'text-color' : 'text-white'
                        )}
                    />
                )}
            </div>
        </Card>
    )
}

export default Nft
