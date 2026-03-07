import { useQuery } from "@tanstack/react-query";
import { getNewsSettings, getPublicNews } from "../../api/newsApi";

export const NewsListPage = () => {
  const { data: settings } = useQuery({ queryKey: ["newsSettings"], queryFn: getNewsSettings });
  const { data: list = [], isLoading } = useQuery({ queryKey: ["newsList", {}], queryFn: () => getPublicNews({}) });

  if (isLoading) return <div className="p-4">Loading news feed...</div>;

  return (
    <main className="grid gap-4 p-4 lg:grid-cols-[260px_1fr_360px]">
      <aside className="hidden lg:block">Sources & filters</aside>
      <section className="space-y-3">
        {list.map((item: any) => (
          <article key={item._id} className="rounded-xl border p-3">
            <img src={item.coverImageUrl || settings?.defaultBannerUrl} className="h-40 w-full rounded object-cover" />
            <h2 className="line-clamp-2 pt-2 font-semibold">{item.title}</h2>
            <p className="line-clamp-2 text-sm opacity-75">{item.shortSummary}</p>
          </article>
        ))}
      </section>
      <aside className="hidden lg:block">Preview panel</aside>
    </main>
  );
};
