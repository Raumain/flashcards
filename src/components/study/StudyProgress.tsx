interface StudyProgressProps {
	current: number
	total: number
	correct: number
	wrong: number
}

export function StudyProgress({ current, total, correct, wrong }: StudyProgressProps) {
	const progress = ((current - 1) / total) * 100

	return (
		<div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
			<div className="flex items-center justify-between mb-3">
				<span className="text-sm font-medium text-gray-700">
					Carte {current} sur {total}
				</span>
				<div className="flex items-center gap-4 text-sm">
					<span className="flex items-center gap-1.5">
						<span className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
						<span className="text-gray-600">{correct}</span>
						<span className="sr-only">réponses correctes</span>
					</span>
					<span className="flex items-center gap-1.5">
						<span className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
						<span className="text-gray-600">{wrong}</span>
						<span className="sr-only">réponses incorrectes</span>
					</span>
				</div>
			</div>

			<div
				className="h-2 bg-gray-100 rounded-full overflow-hidden"
				role="progressbar"
				aria-valuenow={current}
				aria-valuemin={1}
				aria-valuemax={total}
				aria-label={`Progression: carte ${current} sur ${total}`}
			>
				<div
					className="h-full bg-blue-500 transition-all duration-300 ease-out"
					style={{ width: `${progress}%` }}
				/>
			</div>
		</div>
	)
}
