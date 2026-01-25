import type { RevisionCard } from '~/server/functions/study'

interface RevisionCardPreviewProps {
	card: RevisionCard
}

export function RevisionCardPreview({ card }: RevisionCardPreviewProps) {
	const getBadgeClasses = (errorCount: number): string => {
		if (errorCount >= 5) return 'bg-red-100 text-red-700'
		if (errorCount >= 3) return 'bg-orange-100 text-orange-700'
		return 'bg-yellow-100 text-yellow-700'
	}

	return (
		<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
			<div className="flex items-center gap-3 flex-1 min-w-0">
				<span className="text-lg flex-shrink-0" aria-hidden="true">
					{card.thematicIcon}
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-sm text-gray-900 truncate">{card.front.question}</p>
					<p className="text-xs text-gray-500">{card.thematicName}</p>
				</div>
			</div>
			<span
				className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getBadgeClasses(card.errorCount)}`}
			>
				{card.errorCount} erreur{card.errorCount > 1 ? 's' : ''}
			</span>
		</div>
	)
}
