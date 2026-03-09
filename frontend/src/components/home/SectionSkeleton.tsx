const p = 'animate-pulse bg-gray-200 dark:bg-gray-800 rounded-2xl';

export function SearchSkeleton() {
  return <div className={`${p} h-12 max-w-2xl mx-auto rounded-full`} />;
}

export function HeroSkeleton() {
  return <div className={`${p} h-56 md:h-72 mx-4 md:mx-0`} />;
}

export function CarouselSkeleton({ count = 3, height = 'h-52' }: { count?: number; height?: string }) {
  return (
    <div className="flex gap-4 overflow-hidden px-4 md:px-0">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${p} ${height} shrink-0 w-[80vw] sm:w-[60vw] md:w-[45%] lg:w-[32%]`}
        />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 4, height = 'h-44' }: { count?: number; height?: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-0">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${p} ${height}`} />
      ))}
    </div>
  );
}

export function ChipsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden px-4 md:px-0">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-full h-9 w-24 shrink-0" />
      ))}
    </div>
  );
}

/** Full-page home skeleton used while initial data loads */
export default function HomeSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      <SearchSkeleton />
      <HeroSkeleton />
      <CarouselSkeleton count={3} height="h-44" />
      <CarouselSkeleton count={3} height="h-64" />
      <ChipsSkeleton />
      <CarouselSkeleton count={3} height="h-52" />
      <CarouselSkeleton count={3} height="h-52" />
      <CarouselSkeleton count={4} height="h-48" />
      <CarouselSkeleton count={4} height="h-56" />
      <CarouselSkeleton count={4} height="h-36" />
    </div>
  );
}
