---
title: Hire Me
date: 2026-08-03T16:35:00
summary: Available for senior and principal engineering roles.
subtitle: true
menus:
  - footer_left
---

I'm Blake Rain, a UK-based software engineer with over 20 years of experience across FinTech,
PropTech, telecoms, and film post-production. I build across the stack: systems at the boundary of
software and hardware (JIT compilers, packet processors, custom NIC drivers) and cloud-native
distributed systems on AWS, from serverless orchestration to AI/ML integration. I'm now available
for senior, principal, and staff engineering roles.

<div class="hire-cta">
  <a class="plain button" href="/downloads/cv.pdf">Download my CV (PDF)</a>
  <a class="plain button" href="mailto:blake.rain@blakerain.com">Email me</a>
</div>

---

## What I Do

<div class="hire-cards">
  <div class="hire-card">
    <h3>Systems &amp; Low-Level</h3>
    <p>
      JIT compilers, packet processors, custom NIC drivers, and embedded development on ARM and
      FPGA. I work comfortably in Rust, C, and C++ at the boundary of software and hardware.
    </p>
  </div>
  <div class="hire-card">
    <h3>Cloud &amp; Distributed</h3>
    <p>
      Cloud-native systems on AWS: serverless orchestration with Lambda and API Gateway,
      infrastructure as code, AI/ML integration with Bedrock and Transcribe, and OAuth 2.0
      authorisation services.
    </p>
  </div>
  <div class="hire-card">
    <h3>Regulated &amp; Financial</h3>
    <p>
      Deep experience in regulated environments: PCI-DSS Level 1 service provider compliance, FCA
      mandates, GDPR, and financial modelling. I enjoy the technical side of an audit.
    </p>
  </div>
</div>

---

## Selected Highlights

- Designed and built **Eclipse**, a layer-2 transparent appliance that acted as the entire
  cardholder data environment for contact centres, removing almost all PCI-DSS scope from customers.
  It processed 8-10 TB of traffic daily in a production data centre.
- Built a **JIT-compiled packet processor** (x86-64 and ARM) that dynamically rewrote filtering
  rules per SIP session, performing real-time DTMF redaction on multi-Gbps traffic, alongside a
  custom user-space driver for Intel Gigabit Ethernet controllers running an L2 Ethernet switch.
- Achieved and maintained **PCI-DSS Level 1 Service Provider** certification with zero findings
  across multiple annual audits, and led the transition from 3.2.1 to 4.0.
- Built a **call compliance platform** integrating Amazon Transcribe and Bedrock to generate
  transcripts with AI-flagged key moments, supporting FCA-mandated reviews (Rust, HTMX, Web
  Components).
- Built an **OAuth 2.0 authorisation service** (RFC 6749, 7636, 7662, PASETO) providing SSO across
  a health policy platform and mobile app, with TOTP support and Lua policies.
- Built a **domain-specific JIT compiler** for a film-look effects engine, enabling real-time HD
  playback on consumer hardware; the product was demoed at NAB Las Vegas.
- Designed a **campaign graph engine** that compiled management-authored visual graphs into
  optimized SQL, driving automated outreach and dialling for contact centres managing ~1.4m tenants.

---

## Recent Experience

<ol class="timeline">
  <li>
    <div class="timeline-when">
      <span class="timeline-date">2024&ndash;2026</span>
      <span class="timeline-company">Cignpost Group</span>
    </div>
    <span class="timeline-marker" aria-hidden="true"></span>
    <div class="timeline-details">
      <h3>Software Architect</h3>
      <p>
        Compliance operations platform with AI call analysis, OAuth 2.0 SSO service, and data
        analytics for a health insurance product.
      </p>
    </div>
  </li>
  <li>
    <div class="timeline-when">
      <span class="timeline-date">2019&ndash;2024</span>
      <span class="timeline-company">Neo Technologies</span>
    </div>
    <span class="timeline-marker" aria-hidden="true"></span>
    <div class="timeline-details">
      <h3>Technical Director</h3>
      <p>
        PCI-DSS de-scoping appliance, JIT-compiled packet processing, and AWS cloud orchestration
        for contact centres.
      </p>
    </div>
  </li>
  <li>
    <div class="timeline-when">
      <span class="timeline-date">2014&ndash;2019</span>
      <span class="timeline-company">Inchora</span>
    </div>
    <span class="timeline-marker" aria-hidden="true"></span>
    <div class="timeline-details">
      <h3>Head of Technology</h3>
      <p>
        Contact centre CRM, adaptive dialler, and tenant notification platform for ~1,700 letting
        agent offices.
      </p>
    </div>
  </li>
  <li class="contracting">
    <div class="timeline-when">
      <span class="timeline-date">2008&ndash;2014</span>
    </div>
    <span class="timeline-marker" aria-hidden="true"></span>
    <div class="timeline-details">
      <h3>Contract Software Engineer</h3>
      <p>
        Independent contracting, including PropYield, a SaaS calculator for commercial property
        investment analysis that performed goal-seeking across financial variables (yield, LTV,
        equity return, interest cover) using Powell's dog leg method, followed by early SaaS work
        for Inchora, including the first incarnations of Inchora Home.
      </p>
    </div>
  </li>
  <li>
    <div class="timeline-when">
      <span class="timeline-date">2005&ndash;2008</span>
      <span class="timeline-company">AmberVisual</span>
    </div>
    <span class="timeline-marker" aria-hidden="true"></span>
    <div class="timeline-details">
      <h3>Software Engineer</h3>
      <p>
        Real-time film-look effects engine with a custom JIT compiler, shipped as an AfterEffects
        plugin and render-farm pipeline.
      </p>
    </div>
  </li>
</ol>

Earlier contracting work included industrial automation: FPGA-driven graphics pipelines, distributed
consensus across ARM field units, and custom Linux distributions for GSM-connected hardware.

More details on my experiences can be found on my [CV](/downloads/cv.pdf).

---

## What I'm Looking For

Senior, principal, or staff engineering roles. I prefer permanent positions where I can own hard
technical problems. I'm particularly well suited to:

- Systems engineering in Rust, C, or C++: code generation, networking and packet processing,
  embedded work.
- Cloud backend engineering on AWS (Lambda, API Gateway, CF, CDK, etc.), including AI/ML
  integration.
- Teams operating in regulated environments (finance, insurance, telecoms), including owning policy
  and procedures, and engaging with auditors.

I'm based in Norwich, UK, and set up for fully remote work. I'm happy to travel for on-site days.

---

## Contact

The fastest way to reach me is by email. You can also find me on the usual networks, or browse my
code on GitHub and my self-hosted Forgejo instance.

<ul class="contact">
  <li>
    {{< ico vendor="bootstrap" name="envelope-at" >}}
    <span>Email</span>
    <div>{{< encode-link protocol="mailto" target="blake.rain@blakerain.com" text="blake.rain@blakerain.com" >}}</div>
  </li>
  <li>
    {{< ico vendor="bootstrap" name="linkedin" color="#0A66C2" >}}
    <span>LinkedIn</span>
    <div><a href="https://www.linkedin.com/in/blakerain/">linkedin.com/in/blakerain</a></div>
  </li>
  <li>
    {{< ico vendor="bootstrap" name="mastodon" color="#6364FF" >}}
    <span>Mastodon</span>
    <div><a href="https://mastodonapp.uk/@BlakeRain">@BlakeRain@mastodonapp.uk</a></div>
  </li>
  <li>
    {{< ico vendor="bootstrap" name="github" >}}
    <span>GitHub</span>
    <div><a href="https://github.com/BlakeRain">github.com/BlakeRain</a></div>
  </li>
  <li class="forgejo">
    {{< ico vendor="simple-icons" name="forgejo" >}}
    <span>Forgejo</span>
    <div><a href="https://git.blakerain.com/BlakeRain/">git.blakerain.com/BlakeRain</a></div>
  </li>
</ul>
