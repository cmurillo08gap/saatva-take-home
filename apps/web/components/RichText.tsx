// The only place in the web app that renders raw HTML. The HTML comes from the
// BFF, which sanitizes it with an allowlist before it is sent, so it is safe to
// inject here. Keep this the single call site so there is one place to review.
function toInnerHtml(html: string): { __html: string } {
  return { __html: html }
}

export function RichText({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={toInnerHtml(html)} />
}
