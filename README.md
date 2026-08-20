# Virtual PC Lab

Simulazione 3D interattiva di un PC assemblato, pensata per uso didattico: esplora i componenti, esplodili per vederli separati e leggi una breve descrizione della funzione di ciascuno.

**Demo live**: https://lucanenni.github.io/virtual-pc-lab/

## Avvio

```bash
npm install
npm run dev
```

Apri `http://localhost:5180` (porta fissata con `strictPort`).

## Cosa fa

- Carica un modello 3D dettagliato di un PC gaming (case a vetro, motherboard, GPU, RAM, PSU, raffreddamento a liquido) via Three.js + `GLTFLoader`.
- Il pulsante **Esplodi/Riassembla** separa tutti i componenti lungo traiettorie realistiche (es. le RAM si estraggono verso l'alto, non attraverso la scheda madre) e allontana automaticamente la camera per tenerli tutti a vista.
- Cliccando un componente (anche attraverso il pannello in vetro del case) se ne mostra il nome e una breve descrizione della funzione.
- Rendering PBR con ambiente riflettente, ombre morbide e bloom leggero sugli accenti RGB.

## Tecnologie

Vite + [Three.js](https://threejs.org/).

## Crediti

Il modello 3D (`public/models/dream_computer_setup.glb`) è **"Dream Computer Setup"** di Daniel Cardona, licenza CC BY 4.0 — dettagli in [public/models/CREDITS.md](public/models/CREDITS.md).

## Licenza

Il codice di questo progetto è distribuito con licenza [MIT](LICENSE). Il modello 3D bundled ha una licenza propria (CC BY 4.0, attribuzione richiesta) — vedi [CREDITS.md](public/models/CREDITS.md).
