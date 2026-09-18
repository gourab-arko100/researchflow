import { GlobalSearch } from "@/components/search/global-search";

export default function SearchPage() {
  return (
    <main className="container-page max-w-2xl py-16">
      <h1 className="font-display text-3xl">Search</h1>
      <p className="mt-2 font-sans text-sm text-ink-soft dark:text-paper/70">
        Across paper titles, extracted page text, your notes, and AI-generated summaries.
      </p>
      <div className="mt-8">
        <GlobalSearch />
      </div>
    </main>
  );
}
