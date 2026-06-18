"use client";

import { useLibraryHistory } from "@/app/context/LibraryContext";
import { SquareArrowOutUpRight, Search } from "lucide-react";
import moment from "moment/moment";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const PRIMARY = "oklch(0.5161 0.0817 211.9)";

function groupByTime(items) {
  const groups = { Today: [], "This Week": [], "This Month": [], Older: [] };
  const now = moment();

  items.forEach((item) => {
    const d = moment(item.created_at);
    if (d.isSame(now, "day")) groups["Today"].push(item);
    else if (d.isSame(now, "week")) groups["This Week"].push(item);
    else if (d.isSame(now, "month")) groups["This Month"].push(item);
    else groups["Older"].push(item);
  });

  return groups;
}

export default function Library() {
  const { history, loading } = useLibraryHistory();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = history.filter((item) =>
    item.searchInput?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = groupByTime(filtered);

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Geist', 'Helvetica Neue', sans-serif" }}
    >
      <div className="max-w-2xl mx-auto px-4 pt-14 pb-20">

        {/* Page title */}
        <h1 className="text-2xl font-semibold text-neutral-800 mb-1">Library</h1>
        <p className="text-sm text-neutral-400 mb-6">Your past searches</p>

        {/* Search filter */}
        <div className="relative mb-8">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Filter searches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-4 py-2.5 text-sm text-neutral-700 placeholder-neutral-400 outline-none focus:border-neutral-400 transition-colors"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-neutral-100 animate-pulse shrink-0" />
                <div className="h-4 rounded bg-neutral-100 animate-pulse flex-1" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-12 w-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
              <Search size={20} className="text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600">
              {search ? "No matches found" : "No searches yet"}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {search ? "Try a different keyword" : "Your search history will appear here"}
            </p>
          </div>
        )}

        {/* Grouped list */}
        {!loading &&
          Object.entries(grouped).map(([label, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={label} className="mb-8">
                {/* Group label */}
                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2 px-1">
                  {label}
                </p>

                {/* Items */}
                <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden divide-y divide-neutral-100">
                  {items.map((item) => (
                    <button
                      key={item.id ?? item.libId}
                      onClick={() => router.push("/search/" + item.libId)}
                      className="w-full group flex items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Dot accent */}
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: PRIMARY }}
                        />
                        <span className="text-sm text-neutral-700 truncate group-hover:text-neutral-900 transition-colors">
                          {item.searchInput}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-neutral-400 hidden sm:block">
                          {moment(item.created_at).fromNow()}
                        </span>
                        <SquareArrowOutUpRight
                          size={13}
                          className="text-neutral-300 group-hover:text-neutral-500 transition-colors"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}