# Tapahtumakalenteri

## Projektin kuvaus

Responsiivinen tapahtumakalenteri, jossa käyttäjä voi selata tapahtumia, hakea ja suodattaa niitä sekä avata tapahtumasta tarkemman näkymän. Tapahtumat haetaan paikallisen backend-palvelimen tarjoamasta JSON-tiedostosta.

## Käytetyt teknologiat

- Vue 3 ja JavaScript käyttöliittymässä
- Vue Router sivun reitityksessä
- Vite kehityspalvelimena ja tuotantokäännöksessä
- CSS responsiiviseen ulkoasuun
- Node.js ja Express backend-palvelimessa
- JSON tapahtumatietojen tallennusmuotona

## Sivuston käynnistäminen

Tarvitset Node.js-version **22.18.x tai 24.12.0 tai uudemman**. Käynnistä backend ja frontend omissa terminaali-ikkunoissaan.

### 1. Käynnistä backend

```powershell
cd backend
npm install
node index.js
```

Backend käynnistyy oletuksena osoitteeseen `http://localhost:3000` ja tarjoaa tapahtumat osoitteessa `http://localhost:3000/api/tapahtumat`. Palvelimen portin voi vaihtaa määrittämällä `PORT`-ympäristömuuttujan.

### 2. Käynnistä frontend

Avaa toinen terminaali projektin juuressa ja suorita:

```powershell
cd frontend
npm install
npm run dev
```

Avaa Viten ilmoittama osoite selaimessa (oletuksena `http://localhost:5173`). Frontend hakee tapahtumat backendiltä, joten backendin on oltava käynnissä.

Tuotantokäännöksen voi tarkistaa komennolla:

```powershell
cd frontend
npm run build
```

## Valmiit ominaisuudet

- Tapahtumakortit muodostetaan backendiltä haetuista JSON-tiedoista.
- Tapahtumia voi hakea nimen, paikkakunnan tai kategorian perusteella ja suodattaa kategorian mukaan.
- Tapahtumat voi lajitella nimen mukaan aakkosjärjestykseen tai käänteiseen järjestykseen.
- Kortista voi avata valitun tapahtuman yksityiskohtanäkymän ja palata tapahtumalistaan.
- Tapahtumakortissa ja yksityiskohtanäkymässä näytetään tapahtuman kuva, kategoria, paikkakunta ja osallistujamäärä, jos tiedot ovat saatavilla.
- Tapahtumien ja osallistujien yhteenlasketut määrät päivittyvät haun ja suodatuksen mukana.
- Tapahtumia voi merkitä suosikeiksi ja poistaa suosikeista. Valinnat säilyvät selaimen `localStorage`-tallennustilassa sivun uudelleenlatauksen jälkeen.
- Mobiilinäkymässä navigaatio avautuu hampurilaisvalikosta, ja tapahtumakortit sekä yksityiskohtanäkymä mukautuvat näytön kokoon.

## Keskeneräiset tai puuttuvat ominaisuudet

- Erillistä suosikkitapahtumien näkymää ei ole toteutettu; suosikit tallentuvat ja näkyvät tapahtumakorteissa. (Tehtävän annossa ei pyydetty)
- Lajittelu osallistujamäärän perusteella puuttuu.
- Tapahtumien päivämäärä- ja kestotietoja ei ole nykyisessä JSON-aineistossa, joten niitä ei näytetä.
- Käyttöliittymä hakee backendin osoitteesta `http://localhost:3000`; backend-osoitteen erillistä frontend-asetusta ei ole toteutettu.

## Tekoälyn käyttö

Tässä projektissa on käytetty **Microsoft Copilotia (Copilot SDK VS Codessa)** ja **OpenAI ChatGPT:tä** käyttöliittymän kehittämisen tukena. Tekoälyä on hyödynnetty Vue-komponenttien ja CSS-tyylien muokkaamisessa ja responsiivisuuden sekä virheiden etsimisessä. ChatGPT:tä on lisäksi käytetty tapahtumien haun, suodatuksen, lajittelun, tapahtumakohtaisen näkymän ja API-yhteyden vianmäärityksen tukena.

## JSON-tiedoston muokkaus

Kuvien tiedostopolkuja päivitettiin vastaamaan projektin kansiorakennetta, jotta kuvat latautuvat sovelluksessa oikein.
