# Nachtregister

**De nacht heeft een burgemeester.**

Nachtregister is een persoonlijk initiatief om de nachtburgemeesters van Nederland te inventariseren — en om ze een groter publiek te geven. Niet als officieel register, maar als één plek waar namen, steden, bronnen en verhalen samenkomen.

De site staat live op **[nachtburgemeester.com](https://nachtburgemeester.com/)**.

De site beweegt: rook, sterren, een kaart die zich opent, een hologram-pass, een scrollende Marquee en paginatransities. Alle effecten respecteren `prefers-reduced-motion`.

## Waarom dit bestaat

Het begon met een simpele vraag: wie spreekt er eigenlijk voor de nacht?

De nacht is geen gat in de dag. Het is de plek waar cultuur ontstaat, waar mensen samenkomen en waar de stad zich van een andere kant laat zien. Toch wordt er vaak over de nacht gesproken door mensen die er zelf nooit zijn. De nachtburgemeester is een van de mensen die dat gat probeert te dichten: als adviseur, verbinder of maker.

In Nederland zijn er inmiddels op veel plekken van zulke rollen — officieel benoemd, zelf uitgeroepen of georganiseerd in een collectief. Maar er was geen actueel, openbaar overzicht met bronnen en controledata. Dat is dit register.

Door de namen en verhalen op één plek te zetten, wordt de nachtburgemeester zichtbaarder. Voor bewoners, makers, journalisten, gemeenten en iedereen die de nacht serieus neemt.

## Wat je hier vindt

- **22 vermeldingen** met bron en controledatum.
- **14 burgemeesters**, **4 collectieven** en **4 steden zonder** op dit moment.
- Een interactieve kaart van Nederland.
- Een doorzoekbaar register met filters op status en provincie.
- Stadsprofielen met bronnen, achtergrond, mini-kaart en een correctielink.
- **Den Haag als eerste stad met een nachtleven-laag**: PIP, Inter-City en Club Laak, plus een handmatig bijgehouden agenda.
- Uitleg over de methode: geen naam zonder bron, geen wijziging zonder datum.

De stand is **21 november 2026**. Den Haag heeft met **Lotte Ottevanger** een bevestigde burgemeester. In Amsterdam is **Freek Wallagh** de zittende burgemeester; zijn opvolger wordt op **26 november 2026** gekozen. Tilburg en Breda staan nog op de onderzoekslijst. Waar geen bevestigde bron is, staat niets — ook geen gerucht.

## Hoe het register werkt

Dit is geen gemeentelijk orgaan en geen overheidsregister. Het is een onafhankelijk, redactioneel overzicht.

Elke vermelding heeft:

- een **status**: burgemeester, collectief of geen burgemeester;
- een **bron** met link en datum;
- een **controledatum**;
- waar mogelijk een **verhaal** over de rol, de stad en de mensen erachter.

We publiceren liever minder dan iets onzekers. Klopt er iets niet? Gebruik het [correctieformulier](https://nachtburgemeester.com/correcties/) of mail **[hallo@nachtburgemeester.com](mailto:hallo@nachtburgemeester.com)**. We controleren elke melding en reageren binnen vijf werkdagen.

## Bijdragen

**Iedereen mag bijdragen om dit register verder te brengen.** Dat kan op verschillende manieren:

- **Een correctie melden** — met bron en datum. Dat is de snelste manier om het register beter te maken.
- **Een ontbrekende stad of rol aandragen** — alleen als je een bron kunt geven. Geen voordracht, geen campagne, geen “ik vind dat”.
- **Een archiefstuk, besluit of lokaal artikel delen** — juist de minder voor de hand liggende bronnen maken dit register compleet.
- **Een foto met rechten insturen** — een portret van de burgemeester (met toestemming) of een gelicenseerd stadsbeeld.
- **Code of design bijdragen** — open een issue of pull request. Houd wijzigingen klein en controleer je build.
- **Een tip geven** — een gemeente, een nachtcollectief, een festival of een persoon die we nog missen.

Wat we **niet** doen: voordrachten organiseren, betaalde vermeldingen plaatsen, verkiezingscampagnes voeren of namen publiceren zonder bron.

### Aan de slag als ontwikkelaar

De site is gebouwd met [Astro](https://astro.build/) en draait statisch op GitHub Pages.

```bash
npm install
npm run dev      # lokaal op http://localhost:4321
npm run build    # data validatie + statische build naar dist/
npm run preview  # preview van de build
npm run validate # controleert src/data/cities.json
```

De belangrijkste bestanden:

```text
src/data/cities.json      de 22 vermeldingen
src/data/map.json         de SVG-kaart
src/lib/cities.ts         types, tellingen en datumformattering
src/pages/                homepage, profielen, methode, correcties, juridisch
src/components/           header, footer, kaart, register, poster, formulier
src/scripts/site.js       zon, thema, kaart, filters en formulier
src/styles/effects.css   afterhours-laag: sterren, licht, kaart, hologram
src/scripts/effects.js   sterren, sectierail, marquee, tilt en rookpuffs
scripts/validate-data.mjs bouwcontrole op bronnen, aantallen en foto's
scripts/rewrite-base.mjs  optionele padcorrectie voor subpath-previews
```

De build faalt bij ontbrekende bronnen, verkeerde aantallen of een ontbrekend fotobestand. Draai daarom altijd `npm run build` vóór een pull request.

De deploy loopt via `.github/workflows/deploy.yml`. De workflow bouwt voor de root van `nachtburgemeester.com`; `public/CNAME` legt het domein vast. Geen API-keys of geheimen in de repo.

## Den Haag: nachtleven

Den Haag is de eerste stad met een culturele laag op het profiel. Drie plekken:

- **[PIP](https://pipdenhaag.nl/)** — club, tuin en expo aan de Binckhorstlaan.
- **[Inter-City](https://inter-city.nl/)** — cultuurpark van 8.000 m² met drie zalen, theater en café.
- **[Club Laak](https://laak.club/)** — intieme club aan Lulofsstraat 59, achter de metalen poort.

De agenda is bijgewerkt op **21 november 2026** op basis van de clubagenda's en [Resident Advisor](https://ra.co/clubs/30689). De data staat in `src/data/den-haag-culture.json`: per plek een id, adres, website, agenda en beschrijving; per event een datum, tijd, bron, ticketlink en optioneel `soldOut`. Tijden en line-ups kunnen wijzigen; de bron van de club is leidend. De build controleert de cultuurdata mee.

## Fotografie

- **Freek Wallagh** — portret door Vera de Kok, CC BY-SA 4.0, via Wikimedia Commons.
- **21 stadsbeelden** — gelicenseerde sfeerbeelden van Wikimedia Commons, met fotograaf, licentie en bron onder elk profiel.
- Stadsbeelden zijn **geen portretten** van de burgemeester; ze zijn herkenbaar van de stad en duidelijk als sfeerbeeld gelabeld.

Stuur je een portret in? Doe dat alleen met toestemming van de geportretteerde en de fotograaf, of met een vrije licentie. Bij twijfel kiezen we liever een stadsbeeld dan een foto zonder rechten.

## Gebruik

De teksten en het register zijn met zorg samengesteld. Citeren mag met bronvermelding en een link naar de betreffende pagina. Voor hergebruik van de dataset of grotere delen van de site: mail even, dan stemmen we dat af.

Foto's vallen onder de licentie die bij de foto staat. De code staat publiek om aan bij te dragen. Wil je de site of dataset hergebruiken? Mail even, dan stemmen we bronvermelding en voorwaarden af. Door een pull request te sturen, geef je toestemming om je bijdrage op deze site te publiceren.

## Contact

- Correcties: [correctieformulier](https://nachtburgemeester.com/correcties/)
- E-mail: [hallo@nachtburgemeester.com](mailto:hallo@nachtburgemeester.com)
- Live: [nachtburgemeester.com](https://nachtburgemeester.com/)
- Methode: [nachtburgemeester.com/methode/](https://nachtburgemeester.com/methode/)
- GitHub: [github.com/benrv/nachtburgermeester.com](https://github.com/benrv/nachtburgermeester.com)

Dit is een persoonlijk initiatief. Geen gemeente, geen overheidsregister, geen commercieel platform. Wel een poging om de nacht en de mensen die ervoor staan serieus te nemen.

**De nacht heeft een burgemeester. In 14 steden. Met naam, bron en datum.**
