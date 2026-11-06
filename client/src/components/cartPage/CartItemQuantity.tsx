import { useEffect, useState } from "react"
import QuantityInput from "../cart/QuantityInput"

type Props = {
    value: number,
    max: number,
    disabled?: boolean,
    onSave: (quantity: number) => Promise<boolean>
}

export function CartItemQuantity({
    value,
    max = 99,
    disabled = false,
    onSave,
}: Props) {
    const [draftQuantity, setDraftQuantity] = useState(value)

    useEffect(() => {
        if (disabled || draftQuantity == value) return

        const timer = window.setTimeout(() => {
            async function saveQuantity() {
                const succses = await onSave(draftQuantity);
                if (!succses) {
                    setDraftQuantity(value)
                }
            }
            saveQuantity();
        }, 400)

        return () => {
            window.clearTimeout(timer);
        }
    }, [draftQuantity, value, disabled, onSave])

    return (
        <QuantityInput
            value={draftQuantity}
            min={1}
            max={Math.max(1, max)}
            disabled={disabled}
            onChange={setDraftQuantity}
        />
    )
}