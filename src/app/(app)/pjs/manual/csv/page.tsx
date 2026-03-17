import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Quando Usar",
    items: [
      "Use a importacao CSV quando precisar cadastrar ou atualizar muitos PJs de uma vez.",
      "Para poucos registros, o preenchimento pela tela costuma ser mais rapido e seguro.",
    ],
  },
  {
    title: "Fluxo",
    items: [
      "Na tela /pjs, clique em Importar CSV.",
      "Baixe o template oficial.",
      "Preencha o arquivo sem alterar os headers.",
      "Envie o CSV no modal de importacao.",
      "Revise o resultado por linha ao final.",
    ],
  },
  {
    title: "Regras Do Arquivo",
    items: [
      "A primeira linha deve conter exatamente os headers do template.",
      "Cada linha representa um unico PJ.",
      "Valores booleanos aceitos: true, 1, sim, yes, y.",
      "Valores numericos podem usar 1234.56 ou 1.234,56.",
      "Datas devem preferencialmente usar YYYY-MM-DD.",
    ],
  },
  {
    title: "Campos Mais Importantes",
    items: [
      "Cadastro: nome_completo, cpf, email, telefone.",
      "Empresa: razao_social, cnpj.",
      "Vinculo: status_vinculo, data_inicio, tipo_contrato_categoria, gestor_responsavel, area, marca, centro_custo.",
      "Financeiro: valor_mensal_contratado, valor_ajuda_custo, valor_total_mensal_previsto.",
      "Beneficios: beneficios.plano_saude.*, beneficios.plano_odontologico.*, beneficios.vt.* e beneficios.vr_va.*.",
    ],
  },
  {
    title: "Dependentes Do Plano De Saude",
    items: [
      "Dependentes devem ser enviados na coluna beneficios.plano_saude.dependentes_json.",
      "O valor dessa coluna precisa ser um JSON array valido.",
      "Cada objeto do array representa um dependente.",
      "Se o PJ nao tiver dependentes, deixe a coluna vazia.",
    ],
    code: `[
  {
    "nome": "Maria",
    "parentesco": "Filha",
    "data_inclusao": "2026-03-01",
    "data_exclusao": "",
    "subsidio_empresa": 100,
    "custo_mensal": 350,
    "coparticipacao_aplicavel": true,
    "observacoes": "Dependente ativo"
  }
]`,
  },
  {
    title: "Erros Comuns",
    items: [
      "Header alterado manualmente.",
      "CPF ou CNPJ ausente.",
      "E-mail invalido.",
      "Status do vinculo fora dos valores suportados.",
      "JSON invalido em beneficios.plano_saude.dependentes_json.",
      "PJ ativo duplicado com mesmo CPF e CNPJ.",
    ],
  },
  {
    title: "Dica Operacional",
    items: [
      "Teste primeiro com 1 ou 2 linhas.",
      "Depois de validar o formato, importe o lote completo.",
      "Use o resultado da importacao para corrigir apenas as linhas com erro.",
    ],
  },
];

export default function PjCsvManualPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual de Importacao CSV de PJs"
        description="Guia rapido para preencher o arquivo CSV corretamente, incluindo dependentes do plano de saude."
        actions={
          <Button asChild variant="outline">
            <Link href="/api/pjs/import/template">Baixar template CSV</Link>
          </Button>
        }
      />

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.items?.map((item) => (
                <p key={item} className="text-sm text-muted-foreground">
                  {item}
                </p>
              ))}
              {section.code ? (
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 text-xs text-foreground">
                  <code>{section.code}</code>
                </pre>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
