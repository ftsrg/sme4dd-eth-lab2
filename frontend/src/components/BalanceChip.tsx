import { Chip } from 'primereact/chip'
import { classNames } from 'primereact/utils'

type Props = {
    current: number
    base: number
}

function BalanceChip({ current, base }: Props) {
    return (
        <Chip
            label={Math.abs(current - base).toFixed(2)}
            icon={`pi ${current >= base ? 'pi-plus' : 'pi-minus'}`}
            className={classNames('text-white', current >= base ? 'bg-green-500' : 'bg-red-500')}
        />
    )
}

export default BalanceChip
