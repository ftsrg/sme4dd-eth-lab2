import { Chip } from 'primereact/chip'
import { classNames } from 'primereact/utils'

type Props = {
    state: 'fund' | 'invest' | 'withdraw' | 'waiting'
    icon: string
    label: string
    className?: string
}

function StateColoredChip({ state, icon, label, className }: Props) {
    return (
        <Chip
            label={label}
            icon={icon}
            className={classNames(
                className,
                'text-white',
                state === 'fund'
                    ? 'bg-yellow-600'
                    : state === 'invest'
                      ? 'bg-cyan-500'
                      : state === 'withdraw'
                        ? 'bg-green-500'
                        : 'bg-red-500'
            )}
        />
    )
}

export default StateColoredChip
