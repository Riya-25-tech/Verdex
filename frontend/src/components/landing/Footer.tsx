"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";

// lucide dropped brand marks; use inline SVGs for GitHub / X.
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.5-1.11-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.32 9.32 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.24 2h3.3l-7.2 8.23L22.5 22h-6.63l-5.2-6.8L4.7 22H1.4l7.7-8.8L1.5 2h6.8l4.7 6.22L18.24 2Zm-1.16 18h1.83L7.02 3.9H5.06L17.08 20Z" />
    </svg>
  );
}

const SOCIALS = [
  { icon: GithubIcon, label: "GitHub", href: "https://github.com" },
  { icon: BookOpen, label: "Documentation", href: "https://developers.stellar.org/docs/build/smart-contracts" },
  { icon: MessageCircle, label: "Discord", href: "https://discord.com" },
  { icon: XIcon, label: "Twitter", href: "https://twitter.com" },
];

export function Footer() {
  return (
    <footer className="mt-8">
      {/* CTA band */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d4ed8] to-[#4f46e5] px-8 py-14 text-center shadow-card-lg"
        >
          <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-10" />
          <h2 className="relative text-2xl font-semibold text-white sm:text-3xl">
            Start earning on Stellar today
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-white/80">
            Connect a wallet and supply, borrow, or liquidate in minutes — free test funds on
            testnet.
          </p>
          <Link
            href="/app"
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[var(--accent-strong)] transition-transform hover:scale-[1.02]"
          >
            Launch App <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>

      {/* links */}
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-6 border-t pt-8 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Logo />
            <p className="text-xs text-[var(--text-dim)]">
              Overcollateralized lending on Stellar · Soroban
            </p>
          </div>
          <div className="flex items-center gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="grid h-10 w-10 place-items-center rounded-xl border bg-[var(--card)] text-[var(--text-dim)] transition-colors hover:bg-[var(--card-hover)] hover:text-[var(--text)]"
              >
                <s.icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--text-faint)] sm:text-left">
          © {new Date().getFullYear()} Verdex. Testnet software — not financial advice.
        </p>
      </div>
    </footer>
  );
}
