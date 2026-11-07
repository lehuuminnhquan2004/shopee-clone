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
    const [draftQuantity, setDraftQuantity] = useState<number|null>(null)
    const displayedQuantity = draftQuantity ?? value;

    useEffect(() => {
        if (disabled || draftQuantity === null) return

        const quantityToSave = draftQuantity;
        const timer = window.setTimeout(() => {
            async function saveQuantity() {
                if (draftQuantity !== value) {
                    await onSave(quantityToSave);
                }
                setDraftQuantity((current) =>
                    current === quantityToSave ? null : current,
                );
            }
            saveQuantity();
        }, 400)

        return () => {
            window.clearTimeout(timer);
        }
    }, [draftQuantity, value, disabled, onSave])

    return (
        <QuantityInput
            value={displayedQuantity}
            min={1}
            max={Math.max(1, max)}
            disabled={disabled}
            onChange={setDraftQuantity}
        />
    )
}