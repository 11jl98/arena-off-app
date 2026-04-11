import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { CourtsService } from '@/services/courts';
import { CourtCard } from '@/components/booking/CourtCard';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import type { Court } from '@/types/court';

export const Step1Courts: React.FC = () => {
  const { selectCourt } = useBookingFlow();
  const [search, setSearch] = useState('');

  const { data: courts = [], isLoading } = useQuery({
    queryKey: ['courts'],
    queryFn: () => CourtsService.listCourts(),
    staleTime: 2 * 60 * 1000,
  });

  const filtered = courts.filter((c: Court) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          placeholder="Buscar quadra..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm border border-transparent focus:outline-none focus:border-primary focus:ring-0 transition-colors"
        />
      </div>

      {/* Courts list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Nenhuma quadra encontrada.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((court) => (
            <CourtCard key={court.id} court={court} onSelect={selectCourt} />
          ))}
        </div>
      )}
    </div>
  );
};
