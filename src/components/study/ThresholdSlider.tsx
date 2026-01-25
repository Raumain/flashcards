interface ThresholdSliderProps {
	value: number
	onChange: (value: number) => void
	min?: number
	max?: number
}

export function ThresholdSlider({ value, onChange, min = 1, max = 10 }: ThresholdSliderProps) {
	const sliderId = 'threshold-slider'

	return (
		<div className="space-y-3">
			<label htmlFor={sliderId} className="block text-sm font-medium text-gray-700">
				Seuil d'erreurs minimum
			</label>
			<div className="flex items-center gap-4">
				<input
					id={sliderId}
					type="range"
					min={min}
					max={max}
					value={value}
					onChange={(e) => onChange(Number(e.target.value))}
					className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
					aria-valuenow={value}
					aria-valuemin={min}
					aria-valuemax={max}
				/>
				<span
					className="text-lg font-semibold text-blue-600 w-8 text-center tabular-nums"
					aria-hidden="true"
				>
					{value}
				</span>
			</div>
			<p className="text-sm text-gray-500" id={`${sliderId}-description`}>
				Cartes avec au moins {value} réponse{value > 1 ? 's' : ''} incorrecte{value > 1 ? 's' : ''}
			</p>
		</div>
	)
}
