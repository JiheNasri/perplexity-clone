"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  GalleryHorizontalEnd,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ChevronRight,
  SlidersHorizontal,
  Clock,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { useLibraryHistory } from "../context/LibraryContext";

const PRIMARY = "oklch(0.5161 0.0817 211.9)";
const PRIMARY_HEX = "#3d8a96";

const MenuOptions = [
  { title: "New", icon: Plus, path: "/" },
  { title: "Discover", icon: Compass, path: "/discover" },
  { title: "Library", icon: GalleryHorizontalEnd, path: "/library" },
];

export default function AppSidebar() {
  const path = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [open, setOpen] = useState(true);
  const { history, loading } = useLibraryHistory();
  const [usage, setUsage] = useState(null);
  const isPro = usage?.plan === "pro";
  useEffect(() => {
    if (!user) return;
    fetch("/api/usage/me")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, [user]);

  if (!isLoaded) return null;

  return (
    <>
      {/* Collapsed toggle */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
          className="fixed top-4 left-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm transition hover:text-neutral-800"
        >
          <PanelLeftOpen size={15} strokeWidth={1.5} />
        </button>
      )}

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ fontFamily: "'Geist', 'Helvetica Neue', sans-serif" }}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#f7f7f5] border-r border-neutral-200/80 transition-[width] duration-300 ease-in-out ${
          open ? "w-[240px]" : "w-0 overflow-hidden"
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/Perplexity_AI_logo.svg"
              alt="Perplexity"
              width={108}
              height={26}
              style={{ height: "auto" }}
            />
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-700 transition-colors"
          >
            <PanelLeftClose size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="px-2 pt-1 space-y-0.5">
          {MenuOptions.map((menu) => {
            const Icon = menu.icon;
            const active = path === menu.path;
            return (
              <Link
                key={menu.path}
                href={menu.path}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-all ${
                  active
                    ? "bg-white text-neutral-900 font-medium shadow-sm border border-neutral-200/80"
                    : "text-neutral-500 hover:bg-white/70 hover:text-neutral-800"
                }`}
              >
                <Icon
                  size={15}
                  strokeWidth={active ? 2 : 1.6}
                  style={active ? { color: PRIMARY_HEX } : {}}
                  className="shrink-0"
                />
                {menu.title}
              </Link>
            );
          })}
        </nav>

        {/* ── Divider ── */}
        <div className="mx-3 mt-3 mb-2 border-t border-neutral-200/80" />

        {/* ── Recents ── */}
        <div className="flex-1 overflow-hidden flex flex-col px-2">
          {/* Section header */}
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Recents
            </span>
            <button
              onClick={() => router.push("/library")}
              title="View all"
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <SlidersHorizontal size={12} />
            </button>
          </div>

          {/* List */}
          <div
            className="flex-1 overflow-y-auto space-y-0.5 pr-0.5
            [&::-webkit-scrollbar]:w-[3px]
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-neutral-300
            [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {/* Skeletons */}
            {loading && (
              <div className="space-y-1 pt-1">
                {[80, 60, 72, 55, 68].map((w, i) => (
                  <div
                    key={i}
                    className="h-3.5 rounded-md bg-neutral-200/70 animate-pulse mx-1"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && history.length === 0 && (
              <p className="text-[12px] text-neutral-400 px-1 pt-1">
                No searches yet
              </p>
            )}

            {/* Items */}
            {!loading &&
              history.map((item) => {
                const active = path === `/search/${item.libId}`;
                return (
                  <button
                    key={item.id ?? item.libId}
                    onClick={() => router.push("/search/" + item.libId)}
                    className={`w-full group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                      active
                        ? "bg-white border border-neutral-200/80 shadow-sm"
                        : "hover:bg-white/70"
                    }`}
                  >
                    <Clock
                      size={11}
                      className="shrink-0 text-neutral-300 group-hover:text-neutral-400 transition-colors"
                    />
                    <span
                      className={`text-[12.5px] truncate transition-colors ${
                        active
                          ? "text-neutral-800 font-medium"
                          : "text-neutral-500 group-hover:text-neutral-700"
                      }`}
                    >
                      {item.searchInput}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-2 pb-4 pt-3 space-y-2 border-t border-neutral-200/80 mt-2">
          {/* Upgrade card — free users only */}
          {user && !isPro && (
            <button
              onClick={() => router.push("/upgrade")}
              className="flex w-full items-center gap-2.5 rounded-xl bg-white border border-neutral-200 px-3 py-2.5 transition-all hover:border-neutral-300 hover:shadow-sm group"
            >
              <div
                style={{ backgroundColor: PRIMARY_HEX }}
                className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
              >
                <Zap size={13} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[12px] font-semibold text-neutral-800">
                  Upgrade to Pro
                </p>
                <p className="text-[10px] text-neutral-400">
                  More searches, smarter AI
                </p>
              </div>
              <ChevronRight
                size={13}
                className="text-neutral-300 group-hover:text-neutral-400 transition-colors shrink-0"
              />
            </button>
          )}

          {/* User row */}
          {user ? (
            <div className="flex items-center gap-2.5 px-1 py-1">
              <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-neutral-800 truncate">
                  {user.firstName}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {isPro ? "Pro plan" : "Free plan"}
                </p>
              </div>
              <SignOutButton>
                <button className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors">
                  Log out
                </button>
              </SignOutButton>
            </div>
          ) : (
            <SignInButton mode="modal" appearance={clerkAppearance}>
              <button
                style={{ backgroundColor: PRIMARY_HEX }}
                className="w-full rounded-lg px-3 py-2 text-[12.5px] font-medium text-white hover:opacity-85 transition-opacity"
              >
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </aside>

      {/* Content offset */}
      <div
        className={`transition-[margin] duration-300 ease-in-out ${
          open ? "ml-[240px]" : "ml-0"
        }`}
      />
    </>
  );
}
