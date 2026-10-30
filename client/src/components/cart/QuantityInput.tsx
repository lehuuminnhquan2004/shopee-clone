import './QuantityInput.css'

type QuantityInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
};
export default function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: QuantityInputProps){
    const clamp=(n:number)=>Math.min(max,Math.max(min,n))

    function handleInput(e:React.ChangeEvent<HTMLInputElement>){
        const digits=e.target.value.replace(/\D/g,"");
        onChange(digits===""?min:clamp(Number(digits)))
    }

    return (
    <div className="quantity-input">
      <button
        type="button"
        aria-label="Giảm số lượng"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </button>

      <input
        type="text"
        inputMode="numeric"
        aria-label="Số lượng"
        value={value}
        disabled={disabled}
        onChange={handleInput}
      />

      <button
        type="button"
        aria-label="Tăng số lượng"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </button>
    </div>
  );
}