const fs = require('fs');
const path = 'src/pages/AbaBroncoscopia.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '      <SectionHeader title="Distribuição" />';
const endMarker = '      <SectionHeader title="Evolução" />';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);
console.log('startIdx:', startIdx, 'endIdx:', endIdx);

const tipoPacientePanel = `      <div className="panel-shell p-4">
          <PanelTitle
            title="Tipo de paciente"
            tooltip="Compara o volume agendado e realizado por tipo de paciente dentro do filtro atual."
            comparison={d.comparisons?.charts.comparativo_tipo_paciente}
          />
          {d.isLoading ? (
            <div className="skeleton h-44" />
          ) : comparativoTipoPaciente.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, comparativoTipoPaciente.length * 56)}>
              <BarChart
                data={comparativoTipoPaciente}
                layout="vertical"
                margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#9BAAB8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#5C6B7A" }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<ChartTooltipNum unit="registros" />} cursor={{ fill: "#F0F3F6" }} />
                <Bar dataKey="agendadas" name="Agendadas" fill="#DDE3EA" radius={[0, 4, 4, 0]}>
                  {comparativoTipoPaciente.map((entry) => (
                    <Cell
                      key={\`agendadas-\${entry.name}\`}
                      fill="#DDE3EA"
                      cursor="pointer"
                      onClick={() => {
                        const records = currentRecords.filter(
                          (record) =>
                            record.meta?.tipoPaciente === entry.name &&
                            record.meta?.agendadaBase
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Broncoscopias agendadas do tipo selecionado",
                          description:
                            "Cards que compõem a barra escolhida na série Agendadas de Tipo de paciente.",
                          contextLabel: \`Tipo: \${entry.name}\`,
                          badgeLabel: "Tipo de paciente",
                          accentColor: "#94A3B8",
                          records,
                        });
                      }}
                    />
                  ))}
                </Bar>
                <Bar dataKey="realizadas" name="Realizadas" radius={[0, 4, 4, 0]}>
                  {comparativoTipoPaciente.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TIPO_COLORS[entry.name] ?? "#9BAAB8"}
                      cursor="pointer"
                      onClick={() => {
                        const records = currentRecords.filter(
                          (record) =>
                            record.meta?.tipoPaciente === entry.name &&
                            record.meta?.realizada
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Broncoscopias realizadas do tipo selecionado",
                          description:
                            "Cards que compõem a barra escolhida na série Realizadas de Tipo de paciente.",
                          contextLabel: \`Tipo: \${entry.name}\`,
                          badgeLabel: "Tipo de paciente",
                          accentColor: TIPO_COLORS[entry.name] ?? "#9BAAB8",
                          records,
                        });
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
      </div>`;

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
                  "Broncoscopias realizadas que compõem a barra escolhida em Faturamento por modalidade.",
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
            unit: "broncoscopias",
            color: "#7C3AED",
            yAxisWidth: 120,
            onBarClick: (name) => {
              const records = currentRecords.filter(
                (record) =>
                  record.meta?.origem === name && record.meta?.agendadaBase
              );
              if (!records.length) return;
              setSheetState({
                title: "Broncoscopias da origem selecionada",
                description:
                  "Cards que compõem a barra escolhida em Broncoscopias por origem.",
                contextLabel: \`Origem: \${name}\`,
                badgeLabel: "Broncoscopias por origem",
                accentColor: "#7C3AED",
                records,
              });
            },
          },
          {
            key: "codigos",
            label: "Códigos",
            data: d.por_codigos,
            tooltipType: "count",
            unit: "procedimentos",
            color: "#0891B2",
            yAxisWidth: 90,
            onBarClick: (name) => {
              const records = currentRecords.filter(
                (record) =>
                  record.meta?.codigos === name && record.meta?.agendadaBase
              );
              if (!records.length) return;
              setSheetState({
                title: "Broncoscopias da quantidade de códigos selecionada",
                description:
                  "Cards que compõem a barra escolhida em Quantidade de códigos.",
                contextLabel: \`Códigos: \${name}\`,
                badgeLabel: "Quantidade de códigos",
                accentColor: "#0891B2",
                records,
              });
            },
          },
        ]}
      />`;

const newBlock = `      <SectionHeader title="Distribuição" />

${tipoPacientePanel}

${tabsPanel}

      `;

const newContent = content.substring(0, startIdx) + newBlock + content.substring(endIdx);
fs.writeFileSync(path, newContent, 'utf8');
console.log('Done. New file size:', newContent.length, 'chars');
