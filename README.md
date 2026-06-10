# Auto-jízda

Interaktivní webová simulace jízdy autem pro procvičování úloh na rychlost, vzdálenost a čas. Auto zůstává uprostřed obrazovky, silnice a okolí se posouvají. Nahoře jsou tachometr, analogové hodiny, stopky a ujetá vzdálenost; po silnici jsou kilometrické značky.

## Režimy

| Auto | Režim |
|------|--------|
| červené | **Výpočet rychlosti** — tachometr je „rozbitý“, žák dopočítá rychlost z cíle a času |
| modré | **Výpočet vzdálenosti** |
| zelené | **Výpočet času** |

## Funkce

- výběr auta před startem (během jízdy je výběr uzamčen)
- zadání cíle v km (krok 10, minimum 10 km) a času na stopkách (krok 0,5 h)
- animovaná silnice, rotující kola a vegetace
- kilometrické značky po 10 km
- tachometr, digitální rychlost (km/h jako zlomek), analogové hodiny a stopky
- pauza / pokračování
- **Zpět na start** — vrátí celou simulaci do výchozího stavu
- u červeného auta: ověření odpovědi na rychlost tlačítkem ✓

## Požadavky

- [Node.js](https://nodejs.org/) 18+ (pro lokální vývoj a build)

## Lokální spuštění

```bash
git clone https://github.com/TVUJ-UCET/auto-jizda.git
cd auto-jizda
npm run dev
```

Otevři adresu, kterou vypíše server (typicky `http://localhost:3000`).

Jen vygenerovat `index.html` a spustit vlastní server:

```bash
npm run build
npm start
```

## Úpravy kódu

Hlavní zdroj je `generate-car-animation.cjs` — generuje `index.html`. Po každé změně:

```bash
npm run build
```

SVG auta jsou ve složce `assets/`.

## GitHub Pages

Repozitář lze nasadit jako statickou stránku bez buildu na serveru:

1. Nahraj repozitář na GitHub (`git push`).
2. V repozitáři: **Settings → Pages**.
3. **Source:** Deploy from a branch, větev `main`, složka `/ (root)`.
4. Po chvíli bude simulace na `https://TVUJ-UCET.github.io/auto-jizda/`.

Před pushnutím vždy spusť `npm run build`, aby byl v repu aktuální `index.html`.

## Struktura projektu

```
auto-jizda/
├── assets/                    # SVG aut
├── generate-car-animation.cjs # zdrojový generátor
├── index.html                 # vygenerovaná stránka (pro Pages i lokální náhled)
├── package.json
└── README.md
```

## Licence

MIT — viz soubor [LICENSE](LICENSE).
