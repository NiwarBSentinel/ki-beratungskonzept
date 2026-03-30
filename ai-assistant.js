// ============================================================
// ai-assistant.js — GPT-4o-mini KI-Analyse für KI-Standortcheck
// Additiv: verändert keinen bestehenden Code, nur Erweiterung
// ============================================================

(function () {

   // ── Konfiguration ─────────────────────────────────────────
   const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // <-- hier eintragen
   const MODEL = 'gpt-4o-mini';
    // ──────────────────────────────────────────────────────────

   // Warten bis das Original-Script geladen hat, dann patchen
   window.addEventListener('load', function () {
         const _origZeigeErgebnis = window.zeigeErgebnis;

                               if (typeof _origZeigeErgebnis !== 'function') {
                                       console.warn('[ai-assistant] zeigeErgebnis() nicht gefunden.');
                                       return;
                               }

                               window.zeigeErgebnis = function () {
                                       // Original-Funktion zuerst ausführen
                                       _origZeigeErgebnis.apply(this, arguments);
                                       // Dann KI-Analyse nachladen
                                       setTimeout(injectAIAnalysis, 200);
                               };
   });

   // ── Dimensionsnamen (DE) ───────────────────────────────────
   const dimNamen = {
         'Daten':        'Datenverfügbarkeit & -qualität',
         'Infrastruktur':'Technische Infrastruktur',
         'Kompetenz':    'KI-Kompetenz (intern)',
         'Prozesse':     'Prozessintegration',
         'Führung':      'Führung & Kultur'
   };

   // ── Scores aus DOM lesen (unabhängig von internen Variablen) ─
   function readScoresFromDOM() {
         const result = document.getElementById('result');
         if (!result) return null;

      const stufe = result.querySelector('.stufe-badge')?.textContent?.trim() || '';
         const gesamtEl = result.querySelector('.gesamtscore');
         const gesamt = gesamtEl ? parseFloat(gesamtEl.textContent) : 0;

      const dims = {};
         result.querySelectorAll('.dim-row').forEach(row => {
                 const name = row.querySelector('.dim-name')?.textContent?.trim();
                 const score = parseFloat(row.querySelector('.dim-score')?.textContent);
                 if (name && !isNaN(score)) dims[name] = score;
         });

      return { stufe, gesamt, dims };
   }

   // ── Haupt-Funktion: Box einfügen + API aufrufen ────────────
   async function injectAIAnalysis() {
         const data = readScoresFromDOM();
         if (!data) return;

      const result = document.getElementById('result');
         if (!result || document.getElementById('ai-insight')) return;

      // Box einfügen (nach .empfehlungen, vor Restart-Button)
      const aiBox = document.createElement('div');
         aiBox.id = 'ai-insight';
         aiBox.style.cssText = [
                 'background: linear-gradient(135deg, #ebf8ff 0%, #e9d8fd 100%)',
                 'border-left: 4px solid #4361ee',
                 'border-radius: 12px',
                 'padding: 20px 24px',
                 'margin: 24px 0',
                 'font-size: 0.95em',
                 'line-height: 1.7',
                 'box-shadow: 0 2px 8px rgba(67,97,238,0.08)'
               ].join(';');

      aiBox.innerHTML = `
            <div style="font-weight:700;font-size:1.05em;color:#2b4acb;margin-bottom:10px;">
                    🤖 KI-Analyse (GPT-4o-mini)
                          </div>
                                <div id="ai-insight-text" style="color:#4a5568;">
                                        <span style="opacity:0.6;">Analyse wird generiert…</span>
                                              </div>`;

      const empfehlungen = result.querySelector('.empfehlungen');
         const restartBtn = result.querySelector('.btn-restart');
         if (empfehlungen && restartBtn) {
                 result.insertBefore(aiBox, restartBtn);
         } else {
                 result.appendChild(aiBox);
         }

      // Prompt bauen
      const dimZeilen = Object.entries(data.dims)
           .map(([k, v]) => `  - ${k}: ${v.toFixed(1)}/5.0`)
           .join('\n');

      const prompt = `Du bist ein erfahrener KI-Strategie-Berater. Ein Unternehmen hat einen KI-Reifegrad-Check abgeschlossen.

      Ergebnis:
      - Gesamtstufe: ${data.stufe} (Score: ${data.gesamt.toFixed(1)}/5.0)
      - Dimensionswerte:
      ${dimZeilen}

      Schreibe eine präzise, personalisierte Analyse auf Deutsch (4–5 Sätze):
      1. Benenne die größte Stärke des Unternehmens (höchster Dimensionswert).
      2. Identifiziere den kritischsten Engpass (niedrigster Wert) und erkläre kurz das Risiko.
      3. Nenne den einen konkreten nächsten Schritt mit dem höchsten Hebel.
      Schreibe direkt und ohne Einleitung, als würdest du den Befund mündlich dem Management präsentieren.`;

      try {
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                        },
                        body: JSON.stringify({
                                    model: MODEL,
                                    messages: [{ role: 'user', content: prompt }],
                                    max_tokens: 250,
                                    temperature: 0.7
                        })
              });

           if (!response.ok) {
                     throw new Error(`API Fehler: ${response.status}`);
           }

           const json = await response.json();
              const text = json.choices?.[0]?.message?.content?.trim();

           if (text) {
                     document.getElementById('ai-insight-text').innerHTML =
                                 text.replace(/\n/g, '<br>');
           } else {
                     throw new Error('Leere Antwort');
           }

      } catch (err) {
              document.getElementById('ai-insight-text').innerHTML =
                        `<span style="color:#c53030;">KI-Analyse nicht verfügbar. (${err.message})</span>`;
              console.error('[ai-assistant]', err);
      }
   }

})();
