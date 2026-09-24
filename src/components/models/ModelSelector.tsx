import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useModels } from '@/hooks/useModels'

interface ModelSelectorProps {
  value: string | null
  onChange: (id: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { models, loading } = useModels()

  const classModels = models.filter((m) => m.category === 'classification')
  const segModels = models.filter((m) => m.category === 'segmentation')

  return (
    <Select value={value ?? ''} onValueChange={onChange} disabled={loading}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder={loading ? 'Loading models...' : 'Select a model'} />
      </SelectTrigger>
      <SelectContent>
        {classModels.length > 0 && (
          <SelectGroup>
            <SelectLabel>Classification</SelectLabel>
            {classModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {segModels.length > 0 && (
          <SelectGroup>
            <SelectLabel>Segmentation</SelectLabel>
            {segModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  )
}
