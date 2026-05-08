const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const chains = JSON.parse(fs.readFileSync(path.join(root, 'data', 'chains.json'), 'utf8'));
const outRoot = path.join(root, 'blockchain-security');
const siteUrl = 'https://researchzero.io';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const json = (value) => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');

const contactScript = `(() => {
      const revealContact = () => {
        const links = document.querySelectorAll('[data-contact-link]');
        if (!links.length) return;

        const address = ['research', String.fromCharCode(64), 'researchzero', String.fromCharCode(46), 'io'].join('');
        links.forEach((link) => {
          const label = link.querySelector('[data-contact-label]');
          link.href = ['mailto:', address, '?subject=Security%20review%20request'].join('');
          link.setAttribute('aria-label', \`Email \${address}\`);
          if (label) label.textContent = address;
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', revealContact, { once: true });
      } else {
        revealContact();
      }
    })();`;

const evmProfile = {
  model: 'EVM account-based execution with contracts deployed as bytecode and called through ABI-defined interfaces.',
  languages: ['Solidity', 'Vyper', 'Yul and inline assembly'],
  tooling: ['Foundry', 'Hardhat', 'Slither', 'Echidna', 'Medusa', 'Tenderly-style tracing'],
  standards: ['ERC-20', 'ERC-721', 'ERC-1155', 'ERC-4626', 'Upgradeable proxy patterns', 'Account abstraction patterns'],
  reviewFocus: ['Storage layout and proxy safety', 'Access control and role design', 'Accounting invariants', 'Oracle integration', 'Composability and external calls']
};

const languageProfiles = {
  ethereum: {
    ...evmProfile,
    model: 'Ethereum uses EVM account-based execution, ABI-encoded contract calls, gas-bounded transactions, and mature Solidity/Vyper production tooling.',
    standards: [...evmProfile.standards, 'Mainnet governance and timelock patterns', 'Restaking and staking integrations']
  },
  arbitrum: {
    ...evmProfile,
    model: 'Arbitrum runs EVM-compatible contracts with L2 execution semantics, retryable tickets, bridge flows, and rollup-specific operational assumptions.',
    standards: [...evmProfile.standards, 'Retryable ticket flows', 'L1/L2 gateway integrations']
  },
  base: {
    ...evmProfile,
    model: 'Base runs EVM-compatible contracts on the OP Stack, so Solidity systems must account for L2 bridge behavior, sequencer assumptions, and OP Stack deployment patterns.',
    standards: [...evmProfile.standards, 'OP Stack bridge integrations', 'Smart account and paymaster flows']
  },
  optimism: {
    ...evmProfile,
    model: 'Optimism uses OP Stack EVM execution with cross-domain messaging, L1/L2 withdrawal flows, and Superchain-oriented deployment patterns.',
    standards: [...evmProfile.standards, 'Cross-domain messenger flows', 'OP Stack governance integrations']
  },
  polygon: {
    ...evmProfile,
    model: 'Polygon supports EVM-compatible Solidity and Vyper applications with high-volume token flows, bridge integrations, and network-specific finality assumptions.',
    standards: [...evmProfile.standards, 'PoS bridge integrations', 'High-volume token transfer patterns']
  },
  avalanche: {
    ...evmProfile,
    model: 'Avalanche C-Chain runs EVM-compatible smart contracts, while subnet deployments can add custom validator, bridge, and application-chain assumptions.',
    standards: [...evmProfile.standards, 'C-Chain deployments', 'Subnet and appchain integrations']
  },
  'bnb-smart-chain': {
    ...evmProfile,
    model: 'BNB Smart Chain runs EVM-compatible smart contracts with fast block production, large retail token flows, and frequent exchange or bridge integrations.',
    standards: [...evmProfile.standards, 'BEP-20 token patterns', 'Bridge and exchange integration flows']
  },
  scroll: {
    ...evmProfile,
    model: 'Scroll supports Solidity and Vyper through zkEVM-compatible execution, with rollup bridge, proving, finality, and withdrawal assumptions around normal EVM code.',
    standards: [...evmProfile.standards, 'zkEVM bridge integrations', 'L1/L2 withdrawal flows']
  },
  linea: {
    ...evmProfile,
    model: 'Linea is an EVM-compatible zk-rollup, so Solidity systems should be reviewed for normal EVM issues plus zkEVM deployment, bridge, and finality assumptions.',
    standards: [...evmProfile.standards, 'Canonical bridge flows', 'zkEVM deployment assumptions']
  },
  zksync: {
    model: 'ZKsync supports EVM-oriented development with EraVM differences, native account abstraction, paymasters, custom deployment behavior, and rollup bridge flows.',
    languages: ['Solidity', 'Yul and EVM-oriented code', 'EraVM bytecode', 'Account abstraction contracts'],
    tooling: ['Foundry and Hardhat ZKsync workflows', 'ZKsync Era tooling', 'EraVM-aware testing', 'Static analysis', 'Invariant testing'],
    standards: ['ERC token standards', 'Account abstraction accounts', 'Paymasters', 'Contract factories', 'L1/L2 bridge integrations'],
    reviewFocus: ['Paymaster abuse paths', 'Account validation logic', 'EraVM compatibility', 'Factory deployment controls', 'Bridge and withdrawal assumptions']
  },
  solana: {
    model: 'Solana programs run against an account model where executable programs receive explicit accounts, signer flags, ownership metadata, and instruction data.',
    languages: ['Rust', 'Anchor', 'Native Solana programs', 'Token program integrations'],
    tooling: ['Anchor test framework', 'Solana Program Test', 'Mollusk-style testing', 'Rust fuzzing', 'Local validator workflows'],
    standards: ['SPL Token', 'Token-2022', 'Associated Token Accounts', 'Program Derived Addresses', 'Cross-program invocations'],
    reviewFocus: ['Account validation', 'Signer and owner checks', 'PDA seed design', 'CPI privilege boundaries', 'Initialization and reinitialization']
  },
  aptos: {
    model: 'Aptos uses Move modules and resources, where assets are represented through ownership-aware types and transaction execution is shaped by signer authority.',
    languages: ['Move', 'Aptos Move modules', 'Transaction scripts', 'Resource-oriented asset logic'],
    tooling: ['Aptos CLI', 'Move Prover', 'Move unit tests', 'Formal specifications', 'Localnet workflows'],
    standards: ['Move resources', 'Objects', 'Fungible asset standards', 'Coin modules', 'Module upgrade policies'],
    reviewFocus: ['Resource safety', 'Signer authorization', 'Object ownership', 'Module upgrade controls', 'Asset accounting invariants']
  },
  sui: {
    model: 'Sui uses object-centric Move, where owned, shared, and immutable objects shape transaction behavior and concurrency assumptions.',
    languages: ['Sui Move', 'Move modules', 'Programmable transaction blocks', 'Object-centric asset logic'],
    tooling: ['Sui CLI', 'Move unit tests', 'Sui localnet', 'Move Prover-oriented specs', 'Package upgrade workflows'],
    standards: ['Owned objects', 'Shared objects', 'Capabilities', 'Dynamic fields', 'Coin and token policy patterns'],
    reviewFocus: ['Shared object concurrency', 'Capability leakage', 'Object ownership', 'Package upgrade safety', 'Programmable transaction assumptions']
  },
  canton: {
    model: 'Canton applications are commonly written with Daml contracts and deployed into participant-based workflows with privacy, authorization, and synchronization boundaries.',
    languages: ['Daml', 'Canton application logic', 'Ledger API integrations', 'Participant and domain configuration'],
    tooling: ['Daml SDK', 'Daml Script', 'Canton console', 'Ledger API testing', 'Integration test harnesses'],
    standards: ['Daml templates', 'Contract choices', 'Parties and observers', 'Participant permissions', 'Domain connectivity'],
    reviewFocus: ['Authorization rules', 'Privacy boundaries', 'Settlement workflow logic', 'Participant permissions', 'Off-chain integration controls']
  },
  starknet: {
    model: 'Starknet contracts are written in Cairo and run in a validity-rollup environment with account abstraction, components, storage maps, and L1/L2 messaging.',
    languages: ['Cairo', 'Starknet contracts', 'Sierra and CASM artifacts', 'Account abstraction contracts'],
    tooling: ['Scarb', 'Starknet Foundry', 'Cairo tests', 'Starkli', 'Local devnet workflows'],
    standards: ['SRC token patterns', 'Cairo component libraries', 'Account contracts', 'L1/L2 messaging', 'Upgradeable contract patterns'],
    reviewFocus: ['Cairo logic errors', 'Component composition', 'Storage layout', 'Account abstraction checks', 'Bridge and message handling']
  }
};

const listItems = (items) => items.map((item) => `              <li>${escapeHtml(item)}</li>`).join('\n');

function page(chain) {
  const name = escapeHtml(chain.name);
  const profile = languageProfiles[chain.slug];
  if (!profile) {
    throw new Error(`Missing programming profile for ${chain.slug}`);
  }
  const article = /^[aeiou]/i.test(chain.name) ? 'an' : 'a';
  const canonical = `${siteUrl}/blockchain-security/${chain.slug}/`;
  const title = `${name} Smart Contract Audit Services | ResearchZero`;
  const description = `ResearchZero provides ${chain.name} smart contract audits, blockchain security reviews, protocol risk analysis, and infrastructure security for teams building on ${chain.name}.`;
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${chain.name} smart contract audit services`,
    serviceType: `${chain.name} blockchain security review`,
    provider: {
      '@type': 'Organization',
      name: 'ResearchZero',
      url: siteUrl
    },
    areaServed: 'Worldwide',
    description,
    knowsAbout: [
      chain.name,
      chain.language,
      ...(profile ? profile.languages : []),
      ...(profile ? profile.standards : [])
    ],
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Financial institutions, DeFi protocols, fintech companies, custodians, asset managers, and blockchain infrastructure teams'
    }
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Does ResearchZero support ${chain.name} security reviews?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes. ResearchZero supports ${chain.name} audits and security reviews for smart contracts, protocol logic, infrastructure, integrations, and financial applications built in the ${chain.name} environment.`
        }
      },
      {
        '@type': 'Question',
        name: `What does ${article} ${chain.name} audit cover?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${article[0].toUpperCase()}${article.slice(1)} ${chain.name} audit covers code security, privileged operations, asset movement, accounting assumptions, integration risk, deployment controls, and chain-specific risks such as ${chain.risks.slice(0, 3).join(', ')}.`
        }
      }
    ]
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ResearchZero', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Blockchain Security', item: `${siteUrl}/#supported-chains` },
      { '@type': 'ListItem', position: 3, name: `${chain.name} Security Services`, item: canonical }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" href="${canonical}" hreflang="en">
  <link rel="alternate" href="${canonical}" hreflang="x-default">
  <meta name="theme-color" content="#b91c1c">
  <meta name="author" content="ResearchZero">
  <meta name="application-name" content="ResearchZero">
  <meta name="keywords" content="${chain.name} smart contract audit, ${chain.name} blockchain security, ${chain.name} security review, ${chain.name} protocol audit, ${chain.name} DeFi security, ${chain.name} infrastructure audit">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="ResearchZero">
  <meta property="og:locale" content="en_US">

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">

  <script type="application/ld+json">${json(serviceSchema)}</script>
  <script type="application/ld+json">${json(faqSchema)}</script>
  <script type="application/ld+json">${json(breadcrumbSchema)}</script>

  <link rel="stylesheet" href="../../css/site.css">
  <link rel="icon" type="image/png" sizes="32x32" href="../../favicon-soft-32x32.png">
  <link rel="shortcut icon" href="../../favicon-soft-32x32.png">
</head>
<body class="chain-page">
  <div class="scanlines"></div>
  <div class="noise-overlay"></div>

  <header>
    <nav class="nav" aria-label="Main navigation">
      <div class="container">
        <a href="../../#hero" class="nav-logo">
          <span class="logo-research">RESEARCH</span><span class="logo-zero">ZERO</span>
        </a>
        <ul class="nav-links">
          <li><a href="../../#services" class="nav-link">Services</a></li>
          <li><a href="../../#supported-chains" class="nav-link">Chains</a></li>
          <li><a href="../../#why-us" class="nav-link">Why Us</a></li>
          <li><a href="../../#process" class="nav-link">Process</a></li>
        </ul>
        <div class="nav-right">
          <a href="../../#contact" class="nav-cta-btn">
            Request Security Review
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
          </a>
        </div>
        <button class="nav-hamburger" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  </header>

  <div class="nav-mobile" role="navigation" aria-label="Mobile navigation">
    <a href="../../#services">Services</a>
    <a href="../../#supported-chains">Chains</a>
    <a href="../../#why-us">Why Us</a>
    <a href="../../#process">Process</a>
    <a href="../../#contact" class="nav-cta-btn">Request Security Review</a>
  </div>

  <main>
    <section class="chain-hero">
      <canvas id="hero-canvas"></canvas>
      <div class="hero-glow"></div>
      <div class="container">
        <div class="chain-hero-grid">
          <div class="chain-hero-copy reveal-text" data-delay="0">
            <span class="section-eyebrow">${name} Security</span>
            <h1>${name} Smart Contract Audit Services</h1>
            <p>${escapeHtml(description)} ${escapeHtml(chain.summary)}</p>
            <div class="hero-actions">
              <a href="../../#contact" class="btn-primary">
                <span>Request ${name} audit</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="../../#supported-chains" class="btn-ghost">
                <span>View supported chains</span>
              </a>
            </div>
          </div>
          <aside class="chain-profile reveal-text" data-delay="200" aria-label="${name} security profile">
            <div class="chain-profile-logo">
              <span class="chain-logo chain-logo-${chain.slug}" aria-hidden="true"></span>
              <strong>${name}</strong>
            </div>
            <div>
              <span>Network</span>
              <strong>${name}</strong>
            </div>
            <div>
              <span>Environment</span>
              <strong>${escapeHtml(chain.type)}</strong>
            </div>
            <div>
              <span>Review Surface</span>
              <strong>${escapeHtml(chain.language)}</strong>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <section class="chain-detail-section">
      <div class="container">
        <div class="chain-detail-grid">
          <div class="chain-detail-copy fade-in">
            <span class="section-eyebrow">Supported Environment</span>
            <h2 class="section-title">${name} blockchain security review</h2>
            <p>${escapeHtml(chain.environment)}</p>
            <p>ResearchZero reviews the chain-specific execution model and the financial logic built on top of it. The goal is to identify exploitable code paths before production value, user assets, governance authority, or institutional operations depend on them.</p>
            <p>Engagements can include pre-launch audits, targeted reviews of remediations, protocol architecture review, cross-chain integration assessment, and post-audit support for engineering teams preparing a production deployment.</p>
          </div>
          <div class="chain-risk-panel fade-in">
            <h3>${name} risks we review</h3>
            <ul>
${chain.risks.map((risk) => `              <li>${escapeHtml(risk)}</li>`).join('\n')}
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="chain-services-section">
      <div class="container">
        <div class="chain-programming-panel fade-in">
          <div class="chain-programming-copy">
            <span class="section-eyebrow">Programming Environment</span>
            <h2 class="section-title">${name} smart contract languages and tooling</h2>
            <p>${escapeHtml(profile.model)}</p>
            <p>ResearchZero reviews both the source-level implementation and the execution environment around it: compiler behavior, deployment artifacts, transaction construction, permissions, upgrade paths, and the runtime assumptions that can change how production code behaves.</p>
          </div>
          <div class="chain-programming-grid">
            <div class="chain-programming-card">
              <h3>Languages</h3>
              <ul>
${listItems(profile.languages)}
              </ul>
            </div>
            <div class="chain-programming-card">
              <h3>Tooling</h3>
              <ul>
${listItems(profile.tooling)}
              </ul>
            </div>
            <div class="chain-programming-card">
              <h3>Standards</h3>
              <ul>
${listItems(profile.standards)}
              </ul>
            </div>
          </div>
        </div>

        <div class="services-header fade-in">
          <span class="section-eyebrow">Audit Coverage</span>
          <h2 class="section-title">Security services for ${name} teams</h2>
          <p class="section-subtitle">Focused review for financial protocols, infrastructure providers, fintech teams, custodians, asset issuers, and DeFi applications building in the ${name} ecosystem.</p>
        </div>
        <div class="chain-service-grid">
          <article class="chain-service-card fade-in">
            <h3>Smart contract audits</h3>
            <p>Manual review of code paths that move assets, authorize operations, settle balances, mint or burn tokens, route messages, or modify protocol state.</p>
          </article>
          <article class="chain-service-card fade-in">
            <h3>Protocol risk review</h3>
            <p>Adversarial analysis of economic assumptions, liquidity dependencies, oracle design, governance authority, upgrade controls, and operational failure modes.</p>
          </article>
          <article class="chain-service-card fade-in">
            <h3>Infrastructure assessment</h3>
            <p>Security review for bridges, relayers, indexers, signing flows, custody integrations, monitoring systems, and deployment processes around ${name} applications.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="faq-section chain-faq">
      <div class="container">
        <div class="services-header fade-in">
          <span class="section-eyebrow">${name} FAQ</span>
          <h2 class="section-title">Security review questions for ${name}</h2>
        </div>
        <div class="faq-grid">
          <div class="faq-item fade-in">
            <h3>Does ResearchZero support ${name}?</h3>
            <p>Yes. ResearchZero supports ${name} security reviews for smart contracts, protocol logic, infrastructure, and institutional financial applications.</p>
          </div>
          <div class="faq-item fade-in">
            <h3>What code and systems can be reviewed?</h3>
            <p>We review ${escapeHtml(chain.language)}, protocol architecture, privileged operations, deployment controls, integrations, custody flows, and chain-specific assumptions.</p>
          </div>
          <div class="faq-item fade-in">
            <h3>When should a ${name} audit happen?</h3>
            <p>Schedule review before mainnet deployment, major upgrades, new asset support, bridge integrations, custody changes, or any release that changes how value moves through the system.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cta" id="contact">
      <div class="cta-bg-grid"></div>
      <div class="container">
        <div class="cta-content fade-in">
          <span class="section-eyebrow">Get Started</span>
          <h2 class="cta-title">Secure your<br>${name} protocol</h2>
          <p class="cta-subtitle">Talk to ResearchZero about ${name} smart contract audits, protocol security, infrastructure review, or institutional on-chain finance risk.</p>
          <div class="cta-form">
            <a class="cta-mail-link" href="../../#contact" data-contact-link aria-label="Email ResearchZero">
              <span data-contact-label>Email ResearchZero</span>
              <span class="cta-submit" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </a>
          </div>
          <p class="cta-note">// Confidential scoping. Response within 24 hours.</p>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-main">
        <div class="footer-brand">
          <a href="../../#hero" class="nav-logo footer-logo">
            <span class="logo-research">RESEARCH</span><span class="logo-zero">ZERO</span>
          </a>
          <p class="footer-tagline">Smart contract security for finance moving on-chain.</p>
        </div>
        <div class="footer-column">
          <h4>Services</h4>
          <ul>
            <li><a href="../../#services">Smart Contract Audits</a></li>
            <li><a href="../../#services">Institutional DeFi Security</a></li>
            <li><a href="../../#institutional-blockchain-security">Tokenized Asset Security</a></li>
            <li><a href="../../#supported-chains">${name} Security</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4>Company</h4>
          <ul>
            <li><a href="../../#why-us">About</a></li>
            <li><a href="../../#process">Process</a></li>
            <li><a href="../../#contact">Contact</a></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4>Connect</h4>
          <div class="footer-social">
            <a href="https://x.com/researchzeroio" aria-label="X" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://github.com/researchzero" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
            </a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 ResearchZero. All rights reserved.</p>
        <p>${name} smart contract audits and protocol security.</p>
      </div>
    </div>
  </footer>

  <script>${contactScript}</script>
  <script src="../../js/site.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(outRoot, { recursive: true });
for (const chain of chains) {
  const dir = path.join(outRoot, chain.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(chain));
}

const today = new Date().toISOString().slice(0, 10);
const urls = [
  `${siteUrl}/`,
  ...chains.map((chain) => `${siteUrl}/blockchain-security/${chain.slug}/`)
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);

console.log(`Generated ${chains.length} blockchain security pages.`);
