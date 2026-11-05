# Square

Biglietto da visita digitale con tre varianti: Essential, Studio ed Executive.

Il contatto include nome, cognome, azienda, email e telefono; ruolo e sito web sono facoltativi. Le modifiche e lo stile scelto vengono salvati nel browser del dispositivo.

Il salvataggio in `localStorage` è immediato a ogni modifica, senza attese: chiudendo e riaprendo la scheda sullo stesso sito vengono ripristinati tutti i campi e la variante scelta. I dati restano nel browser e non vengono caricati su GitHub. Cambiando dispositivo, browser o indirizzo del sito si usa un archivio locale distinto; eliminando i dati del sito si elimina anche il profilo salvato.

La pagina iniziale mostra un biglietto largo il 100% e alto il 100% della finestra, senza margini esterni, cornice, top bar, sidebar o scorrimento. Nome, contatti cliccabili, QR e azioni sono integrati nella stessa superficie. Le tre varianti conservano la propria palette.

Il logo aziendale si aggiorna dal campo **Sito web**: viene caricata la favicon all'indirizzo `/favicon.ico` del sito. Se non disponibile, viene usato il servizio favicon di Google, a cui è trasmesso soltanto l'indirizzo di origine del sito, senza nome, email o telefono. Se entrambe le immagini non sono disponibili, oppure il sito manca, appaiono le iniziali dell'azienda. Il caricamento della favicon richiede una connessione di rete.

Il link **Personalizza biglietto** apre la pagina separata `#/personalizza`, con i dati e le tre varianti. **Apri biglietto** riporta alla presentazione `#/biglietto`. Entrambe le pagine funzionano anche nel file HTML autonomo e condividono gli stessi dati.

- Il QR contiene direttamente una vCard 3.0 e viene generato nel browser.
- Il contatto si scarica come file `.vcf`. Se il dispositivo supporta la condivisione dei file, può essere inviato dal menu di condivisione.
- **Tra telefoni** spiega le opzioni disponibili e permette di condividere il file `.vcf` completo o mostrare il QR. Il semplice avvicinamento di due telefoni non è disponibile da una pagina web: Web NFC non supporta la comunicazione peer-to-peer o l'emulazione di una carta. NameDrop è gestito da iOS e non acquisisce i dati della pagina. AirDrop e Quick Share sono opzioni del menu del dispositivo quando disponibili; il sito non avvia una ricerca di telefoni.
- Web NFC scrive il contatto su un tag NDEF compatibile. Richiede un browser supportato, normalmente Chrome su Android, NFC attivo e HTTPS. Non implementa il trasferimento diretto tra due telefoni. La scrittura richiede consenso e può essere annullata.
- Un contatto già condiviso non si aggiorna automaticamente. Dopo una modifica è necessario condividerlo di nuovo.

## Avvio

Su Windows PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

## Verifica e build

```powershell
npm.cmd test
npm.cmd run build
```

La build crea il sito in `dist/` e un artefatto autonomo in `artifacts/square-card.html`. Il file HTML include JavaScript, CSS e libreria QR e può essere aperto direttamente nel browser. Google Fonts è facoltativo: senza rete viene usato il carattere di sistema.

I test verificano il formato vCard, l'escaping, la suddivisione delle righe UTF-8, il download `.vcf` e la decodifica indipendente del QR con jsQR. La scrittura fisica NFC richiede un dispositivo e un tag reali.

Nessun contatto viene inviato a un servizio QR o a un database. Il sito usa Google Fonts per i caratteri.

## GitHub Pages

Il workflow `.github/workflows/deploy.yml` verifica e pubblica il sito a ogni push su `main`. GitHub Pages deve essere configurato con origine **GitHub Actions**. Le risorse usano percorsi relativi per funzionare anche sotto il percorso del repository.

La pagina pubblica è un editor personale: ogni visitatore vede il proprio profilo salvato nel browser. Al primo accesso i campi sono vuoti: il codice pubblico non contiene contatti precompilati. Per scambiare il contatto personalizzato si usa il QR o il file `.vcf`; il solo indirizzo della pagina non include i dati salvati localmente.

Riferimenti: [vCard 3.0, RFC 2426](https://www.rfc-editor.org/rfc/rfc2426.html), [Web NFC](https://developer.chrome.com/docs/capabilities/nfc).
