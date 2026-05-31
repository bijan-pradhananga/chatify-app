import { Badge } from '@/components/ui/badge'

interface Props {
  score: number
  isSpam: boolean
}

export default function SpamBadge({ score, isSpam }: Props) {
  if (isSpam) {
    return (
      <Badge variant="destructive" className="gap-1 text-label-sm rounded-full">
        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
        Spam blocked
      </Badge>
    )
  }
  if (score >= 40) {
    return (
      <Badge className="gap-1 text-label-sm rounded-full bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed">
        <span className="material-symbols-outlined text-[12px]">flag</span>
        Possible spam ({score}%)
      </Badge>
    )
  }
  return null
}
