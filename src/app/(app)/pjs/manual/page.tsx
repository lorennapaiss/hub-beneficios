import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Objetivo",
    items: [
      "O cadastro de PJ concentra dados cadastrais, empresa contratada, vinculo, custo, beneficios por tipo, dependentes do plano de saude e base para o descritivo de desconto.",
    ],
  },
  {
    title: "Preenchimento Pela Tela",
    items: [
      "Acesse /pjs e clique em Novo PJ.",
      "Preencha as abas Cadastro, Empresa, Vinculo e Beneficios.",
      "Salve o cadastro ao final.",
    ],
  },
  {
    title: "Aba Cadastro",
    items: [
      "Preencha nome completo, CPF, e-mail e telefone.",
      "Use Status do cadastro para indicar o andamento interno.",
      "Use Status documental para controlar a regularidade da documentacao.",
    ],
  },
  {
    title: "Aba Empresa",
    items: [
      "Preencha razao social, nome fantasia quando existir e CNPJ.",
      "Use Municipio / UF e Dados bancarios quando necessario.",
      "Marque QSA recebido somente quando o documento tiver sido entregue.",
    ],
  },
  {
    title: "Aba Vinculo",
    items: [
      "Preencha Status do vinculo, Data de inicio, Tipo de contrato, Gestor, Area, Marca e Centro de custo.",
      "Valor mensal contratado, Ajuda de custo e Valor total mensal previsto formam a base financeira do cadastro.",
    ],
  },
  {
    title: "Beneficios Por Tipo",
    items: [
      "Cada beneficio e configurado separadamente: plano de saude, plano odontologico, VT e VR / VA.",
      "Cada bloco possui elegibilidade, status, fornecedor, produto, custeio, datas, subsidio, custo mensal, coparticipacao e observacoes.",
    ],
  },
  {
    title: "Dependentes Do Plano De Saude",
    items: [
      "No bloco Plano de saude, use Adicionar dependente para incluir cada dependente separadamente.",
      "Para cada dependente, preencha nome, parentesco, datas, subsidio, custo mensal, coparticipacao e observacoes.",
      "Remova o dependente da lista quando ele nao fizer mais parte do plano.",
    ],
  },
  {
    title: "Importacao CSV",
    items: [
      "Na tela /pjs, clique em Importar CSV.",
      "Baixe o template oficial antes de montar o arquivo.",
      "Cada linha do CSV representa um PJ.",
      "Dependentes do plano de saude devem ser enviados na coluna beneficios.plano_saude.dependentes_json em formato JSON array.",
    ],
  },
  {
    title: "Exemplo De Dependentes No CSV",
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
      "CPF ou CNPJ ausente.",
      "E-mail invalido.",
      "Status do vinculo fora dos valores suportados.",
      "JSON invalido em beneficios.plano_saude.dependentes_json.",
      "PJ ativo duplicado com o mesmo CPF e CNPJ.",
    ],
  },
  {
    title: "Descritivo De Desconto",
    items: [
      "O cadastro do PJ nao gera sozinho os itens mensais do descritivo.",
      "Para o descritivo funcionar, ainda e necessario preencher pj_descritivo_config e pj_descritivo_itens.",
      "Em pj_descritivo_itens, cada beneficiario deve ter sua propria linha: titular e cada dependente.",
    ],
  },
];

export default function PjManualPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual de Preenchimento de PJs"
        description="Guia operacional para cadastro manual, dependentes do plano de saude e importacao CSV."
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
