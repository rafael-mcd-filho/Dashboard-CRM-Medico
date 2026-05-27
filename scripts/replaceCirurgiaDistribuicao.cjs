const fs = require('fs');
const path = 'src/pages/AbaProcedimentosCirurgicos.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '      <SectionHeader title="Distribuição" />';
const endMarker = '      <SectionHeader title="Evolução" />';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);
const block = content.substring(startIdx, endIdx);

// Extract the "por tipo" panel (first panel in first grid, complex grouped)
const porTipoStart = block.indexOf('        <div className="panel-shell p-4">\n          <PanelTitle\n            title="Faturamento e valor líquido por tipo"');
const porTipoEnd = block.indexOf('\n        <div className="panel-shell p-4">\n          <PanelTitle\n            title="Faturamento por modalidade"');
const porTipoContent = block.substring(porTipoStart + 8, porTipoEnd); // Remove the 8 spaces prefix to make it standalone

// Extract the "ticket por responsavel" panel (second panel in second grid, complex grouped)
const ticketStart = block.indexOf('        <div className="panel-shell p-4">\n          <PanelTitle\n            title="Ticket médio por responsável"');
const ticketEnd = block.lastIndexOf('        </div>\n      </div>');
const ticketContent = block.substring(ticketStart + 8, ticketEnd + 6 + 6); // Get just the panel div content

console.log('por_tipo panel starts at:', porTipoStart, 'ends at:', porTipoEnd);
console.log('ticket panel starts at:', ticketStart, 'ends at:', ticketEnd);
console.log('ticket snippet:', ticketContent.substring(0, 100));

const porTipoPanelText = block.substring(porTipoStart + 8, porTipoEnd);
// We need: <div className="panel-shell p-4">...por tipo content...</div>
// porTipoContent already has opening div, just need to close it and remove extra leading spaces

// Actually let me just find the div boundaries:
// por_tipo: from "        <div className="panel-shell p-4">" to "</div>\n\n        <div className="panel-shell p-4">\n          <PanelTitle\n            title="Faturamento por modalidade""
// ticket: from "        <div className="panel-shell p-4">\n          <PanelTitle\n            title="Ticket médio" to "        </div>\n      </div>"

// Extract por_tipo panel text (with 6 spaces indent → make 6 spaces as outer container)
const porTipoPanelFull = block.substring(porTipoStart, porTipoEnd).trimEnd();
const ticketPanelFull = block.substring(ticketStart, ticketEnd + '        </div>'.length).trimEnd();

// Rebuild: each panel gets leading 6-space indent trimmed from the 8-space inner div to become a 6-space div
function reindent(text, from, to) {
  return text.split('\n').map(line => {
    if (line.startsWith(from)) return to + line.substring(from.length);
    return line;
  }).join('\n');
}

const porTipoPanelRefmt = reindent(porTipoPanelFull, '        ', '      ');
const ticketPanelRefmt = reindent(ticketPanelFull, '        ', '      ');

const tabsPanel = `      <DistribuicaoTabsPanel
        isLoading={d.isLoading}
        tabs={[
          {
            key: "modalidade",
            label: "Modalidade",
            data: d.por_modalidade.map((e) => ({ name: e.name, value: e.fat })),
            tooltipType: "brl",
            color: "#1A56DB",
            yAxisWidth: 110,
            onBarClick: (name) => {
              const records = currentRecords.filter(
                (record) =>
                  record.meta?.modalidade === name && record.meta?.realizada
              );
              if (!records.length) return;
              setSheetState({
                title: "Faturamento da modalidade selecionada",
                description:
                  "Procedimentos realizados que compõem a barra escolhida em Faturamento por modalidade.",
                contextLabel: \`Modalidade: \${name}\`,
                badgeLabel: "Faturamento por modalidade",
                accentColor: "#1A56DB",
                records,
              });
            },
          },
          {
            key: "origem",
            label: "Origem",
            data: d.por_origem,
            tooltipType: "count",
            unit: "procedimentos",
            color: "#7C3AED",
            yAxisWidth: 120,
            onBarClick: (name) => {
              const records = currentRecords.filter(
                (record) =>
                  record.meta?.origem === name && record.meta?.agendadaBase
              );
              if (!records.length) return;
              setSheetState({
                title: "Procedimentos da origem selecionada",
                description:
                  "Cards que compõem a barra escolhida em Procedimentos por origem.",
                contextLabel: \`Origem: \${name}\`,
                badgeLabel: "Procedimentos por origem",
                accentColor: "#7C3AED",
                records,
              });
            },
          },
        ]}
      />`;

const newBlock = `      <SectionHeader title="Distribuição" />

${porTipoPanelRefmt}

${tabsPanel}

${ticketPanelRefmt}

      `;

const newContent = content.substring(0, startIdx) + newBlock + content.substring(endIdx);
fs.writeFileSync(path, newContent, 'utf8');
console.log('Done. New file size:', newContent.length, 'chars');
