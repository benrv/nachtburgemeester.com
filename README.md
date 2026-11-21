# Nachtregister — productie

De productieversie van **nachtburgermeester.com**: een statische Astro-site met 22 stadsprofielen, een interactief register, een kaart, vier hemelstanden en een correctieflow.

## Lokaal

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # data validatie + statische build naar dist/
npm run preview    # preview van dist/
npm run validate   # controleert src/data/cities.json
```

## Structuur

```
src/
  pages/
    index.astro              homepage
    stad/[slug].astro        22 stadsprofielen
    methode.astro            methode & bronnen
    correcties.astro         correctieformulier
    over.astro               over dit register
    privacy.astro            privacyverklaring
    voorwaarden.astro        gebruiksvoorwaarden
    disclaimer.astro         redactionele disclaimer
    404.astro
  components/                header, footer, hero, kaart, register, poster, formulier
  data/
    cities.json              22 gecontroleerde vermeldingen
    map.json                 SVG-kaart van Nederland
  lib/cities.ts              types, counts, datumformattering
  styles/
    base.css                 layout & componenten
    theme.css                vier luchten, rook, beweging
    site.css                 profielen, methode, correcties
  scripts/site.js            zon, thema, rook, kaart, filters, formulier
public/
  fonts/                     self-hosted woff2
  images/                    portret Freek Wallagh + 21 stadsbeelden (Wikimedia Commons)
  og-default.png             1200×630 social image
  favicon.svg, robots.txt
scripts/validate-data.mjs    buildvalidatie
```

## Data

`src/data/cities.json` is de bron van waarheid. Elke vermelding heeft:

- `status`: `actief`, `collectief` of `vacant`
- `name`, `since`, `role`
- `sources[]` met label, URL, datum en titel
- `checked` (ISO-datum)
- optioneel `photo` met alt, credit, licentie en bron
- optioneel `alert` (bijv. de Amsterdamse verkiezing)

De build faalt bij ontbrekende bronnen, verkeerde aantallen, dubbele id's, ongeldige statussen of een ontbrekend fotobestand. Zie `scripts/validate-data.mjs`.

### Foto's

Het fotoslot is klaar. Gebruik alleen portretten met duidelijke rechten en vul `photo` in:

```json
"photo": {
  "src": "/images/naam.jpg",
  "alt": "Portret van …",
  "credit": "Fotograaf",
  "license": "CC BY-SA 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
  "source": "https://commons.wikimedia.org/…"
}
```

Zonder foto gebruikt het profiel het typografische poster-systeem. Alle 22 profielen hebben nu een beeld: Amsterdam een portret (Freek Wallagh, Vera de Kok, CC BY-SA 4.0), de andere 21 een gelicenseerd stadsbeeld als **sfeerbeeld**, met fotograaf, licentie en bron onder de foto.

## Correctieformulier

Het formulier werkt zonder backend via een `mailto:`-fallback naar `hallo@nachtburgermeester.com`. Met **Cloudflare Email Routing** forward je dat adres gratis naar je eigen inbox. De bezoeker verstuurt de melding vanuit het eigen e-mailprogramma; er is geen formulierdienst nodig.

Wil je later een echte formulierendpoint (zonder mailprogramma), zet dan een JSON-endpoint dat `{ city, correction, source, email, page }` accepteert als buildvariabele:

```bash
PUBLIC_CORRECTION_ENDPOINT="https://formspree.io/f/xxxx" npm run build
```

De pagina toont dan een succesmelding in plaats van de mailto-flow.

## Deploy op GitHub Pages

De repo bevat `.github/workflows/deploy.yml`. GitHub Actions bouwt en publiceert `dist/` automatisch.

1. Zet de inhoud van `site/` in een GitHub-repository (branch `main`).
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. Push naar `main`; de workflow bouwt en deployt.
4. Repo → Settings → Pages → Custom domain: `nachtburgermeester.com`. (De site gebruikt absolute paden; een projectpagina op `github.io/repo` werkt daarom niet zonder custom domain.)
5. DNS: apex A-records naar GitHub Pages (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`), `www` CNAME naar `<gebruiker>.github.io`. Zet deze records in Cloudflare DNS op **DNS only** (grijze wolk), anders kan GitHub Pages' SSL-certificaat haperen.
6. Cloudflare Email Routing: voeg `hallo@nachtburgermeester.com` toe en forward naar je inbox. De MX/SPF-records van Cloudflare Email Routing staan los van de website-DNS.

Canoniek domein: `https://nachtburgermeester.com`. GitHub Pages levert geen custom `_headers`; security headers stel je eventueel later in via een Cloudflare-proxy of Workers.

## Juridisch

De pagina’s `/privacy/`, `/voorwaarden/` en `/disclaimer/` staan klaar. Ze vermelden de handelsnaam en het e-mailadres. Laat de teksten voor livegang nog juridisch checken.

## Controle voor livegang

- [ ] 22 records nogmaals gecontroleerd; bron + datum.
- [ ] Amsterdam bijwerken na de verkiezing van 26 november 2026.
- [ ] Cloudflare Email Routing voor `hallo@` activeren en testen.
- [ ] `og-default.png` en favicon controleren.
- [ ] Sitemap/robots in Search Console.
- [ ] Privacyverklaring en voorwaarden juridisch laten checken.
- [ ] Portretrechten per foto vastleggen.

## Status

Productieklare statische site. De data is de stand van **21 november 2026**; de correctieflow is de route om die actueel te houden.
