"use client";

export function EventsPage({ lang }: { lang: string }) {
  return (
    <div className="min-h-screen bg-white" data-lang={lang}>
      <section className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-2 mb-4">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Upcoming Events</h1>
            <p className="text-neutral-600">Get involved and meet your community—no matter where you are.</p>
          </div>
          <hr className="border-neutral-200 my-6" />

          {/* Empty state */}
          <div className="rounded-xl border border-neutral-200 p-8 bg-white">
            <p className="text-neutral-800 text-sm mb-1">There are no upcoming events for now.</p>
            <p className="text-neutral-500 text-xs">We&apos;ll announce new events here soon.</p>
          </div>

          {/* Download CTA for Windows */}
          <div className="mt-10">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">💻</div>
                <div>
                  <p className="text-sm font-medium text-neutral-800">Prefer desktop? Try Captain Clean Sheet for Windows</p>
                  <p className="text-xs text-neutral-500">Fast, native app with offline support and automatic updates.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href="https://github.com/captaininstinct/CaptainCleanSheet/releases/download/v1.1.0/captain-clean-sheet-setup.exe" className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors" target="_blank" rel="noreferrer">Download x64</a>
                <a href="https://github.com/captaininstinct/CaptainCleanSheet/releases/download/v1.1.0/captain-clean-sheet-setup-arm64.exe" className="text-xs px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors" target="_blank" rel="noreferrer">Download arm64</a>
                <a href="https://github.com/captaininstinct/CaptainCleanSheet/releases" className="text-xs px-3 py-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors" target="_blank" rel="noreferrer">View all</a>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-neutral-500">[ LET&apos;S SURF ]</p>
          </div>
        </div>
      </section>
    </div>
  );
}