import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';
import { Children } from 'react';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: Children.toArray([initialProps.styles]),
    };
  }

  render() {
    const title = 'Intento Portal - Orchestrate Your Crypto Workflows';
    const description = 'Intento Portal - The one-stop place for submitting and managing Intento flows. Create, manage, and automate DeFi strategies with just a few clicks. Your intent, executed on any chain, trustlessly, seamlessly, unstoppable. ';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://intento.zone';
    const imageUrl = `${siteUrl}/img/web.png`;

    return (
      <Html lang="en">
        <Head>
          {/* Primary Meta Tags */}
          <meta name="title" content={title} />
          <meta name="description" content={description} />
          <meta name="keywords" content="Intento, DeFi, workflows, agents, trustless, crypto, automation, staking, yield farming, cross-chain, blockchain" />
          <meta name="author" content="Intento" />
          <meta name="robots" content="index, follow" />
          <meta name="theme-color" content="#000000" />
          <link rel="canonical" href={siteUrl} />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={siteUrl} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:site_name" content="Intento" />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={siteUrl} />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={imageUrl} />
          <meta name="twitter:site" content="@intentozone" />
          <meta name="twitter:creator" content="@intentozone" />

          {/* Preconnect to external domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

          {/* Preload critical fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
            media="print"
            onLoad={(e: React.SyntheticEvent<HTMLLinkElement>) => {
              const target = e.target as HTMLLinkElement;
              target.media = 'all';
            }}
          />

          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />

          {/* Preload other critical assets */}
          <link
            rel="preload"
            href="/_next/static/chunks/main.js"
            as="script"
          />

          {/* Preload page-specific chunks */}
          <link
            rel="preload"
            href="/_next/static/chunks/pages/_app.js"
            as="script"
          />

          {/* Performance optimizations */}
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#ffffff" />

          {/* Prefetch DNS for external domains */}
          <link rel="dns-prefetch" href="//intento.zone" />
          <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        </Head>
        <body>
          <Main />
          <NextScript />

          {/* Load non-critical scripts after the page is interactive */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Polyfill for requestIdleCallback
                window.requestIdleCallback = window.requestIdleCallback || function(cb) {
                  const start = Date.now();
                  return setTimeout(function() {
                    cb({ 
                      didTimeout: false,
                      timeRemaining: function() {
                        return Math.max(0, 50 - (Date.now() - start));
                      }
                    });
                  }, 1);
                };

                // Load non-critical CSS
                document.addEventListener('DOMContentLoaded', function() {
                  window.requestIdleCallback(function() {
                    const links = document.querySelectorAll('link[rel="preload"][as="style"]');
                    links.forEach(link => {
                      link.rel = 'stylesheet';
                    });
                  });
                });
              `,
            }}
          />
        </body>
      </Html>
    );
  }
}
