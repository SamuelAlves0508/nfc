# NFC PRO

Aplicativo mobile-first para gestão de clientes, placas NFC e QR Codes.

## Executar

```bash
npm ci
npm run dev
```

Produção: `npm run build` e `npm start`. Node.js 22 ou superior.

## Recursos

- Home responsiva, navegação inferior no celular, sidebar no desktop e tema persistente.
- Clientes e placas: cadastro, edição, busca, filtros, vínculos e exclusão confirmada.
- Dados locais versionados, presets de marca, histórico de QRs e exportação de backup.
- QR Studio com URL, Instagram, WhatsApp, Google Avaliações, telefone, e-mail, texto, Wi-Fi, vCard, PDF por link público, localização e evento.
- Seis estilos de módulos, olhos independentes, cores, gradientes, logos, margens e molduras.
- Validação de contraste e decodificação do QR renderizado no navegador.
- PNG, JPG, SVG e PDF vetorial. PDF de placa com página exata de 100 × 120 mm; PNG de impressão em 300/600 DPI.
- Manifest, ícones de instalação, safe areas e página de contingência sem conexão.

## Limites atuais

Os dados ficam neste navegador, sem conta ou sincronização entre dispositivos. Os exemplos são identificados como demonstração. QRs são estáticos: editar ou desativar uma placa no cadastro não muda nem bloqueia um código já impresso. O aplicativo prepara destinos, mas não grava fisicamente tags NFC.

Google Places, redirecionamento dinâmico e analytics têm contratos separados em `src/lib/services.ts` e ainda precisam de backend. Não há métricas de acesso inventadas. Para QR de PDF, forneça um link público de um arquivo já hospedado. A instalação PWA exige HTTPS; o aplicativo completo requer conexão, com página de contingência offline. A instalação em aparelhos físicos iOS/Android ainda precisa ser validada.

## Verificação

```bash
npx playwright install chromium
node tests/browser-check.mjs
node tests/qr-cases.mjs
```

`CHROMIUM_PATH` permite selecionar um Chromium local. `TEST_OUTPUT` define a pasta das capturas; por padrão, `test-results/`.

O primeiro teste cobre cadastros, persistência, leitura de QR com logo, quatro formatos de exportação, tema e as telas principais em 360, 375, 390, 393, 430, 768, 1024 e 1440 px. O segundo verifica os 12 tipos, acentos e emoji, estilos, gradientes, presets e histórico.
