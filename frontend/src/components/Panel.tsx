import { Avatar } from 'primereact/avatar'
import { Card } from 'primereact/card'
import { classNames } from 'primereact/utils'
import { PropsWithChildren, ReactNode } from 'react'

type Props = {
    icon: string
    title: string
    chips?: ReactNode[]
}

function Panel({ icon, title, chips, children }: PropsWithChildren<Props>) {
    return (
        <Card
            title={
                <span className="flex align-items-center gap-2 mb-3">
                    <Avatar icon={`pi ${icon}`} size="large" shape="circle" />
                    {title}
                </span>
            }
            subTitle={chips ? <div className="flex gap-2">{...chips}</div> : undefined}
            className="w-full"
            pt={{
                content: { className: classNames('pb-0', !chips ? 'pt-0' : '') },
                subTitle: { className: classNames('mb-0') }
            }}
        >
            {children}
        </Card>
    )
}

export default Panel
