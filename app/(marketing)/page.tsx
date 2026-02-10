import fs from 'fs';
import path from 'path';
import Script from 'next/script';

function getLandingBody() {
  const filePath = path.join(process.cwd(), 'index.html');
  const html = fs.readFileSync(filePath, 'utf8');
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = match ? match[1] : html;
  return bodyHtml.replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/i, '').trim();
}

const landingBody = getLandingBody();

export default function MarketingPage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: landingBody }} />
      <Script
        src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
        strategy="beforeInteractive"
      />
      <Script src="/script.js" strategy="afterInteractive" />
    </>
  );
}
