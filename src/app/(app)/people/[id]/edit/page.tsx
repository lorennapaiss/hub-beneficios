import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PersonForm } from "@/components/people/person-form";
import { getPersonById } from "@/server/people";
import { isUuid } from "@/lib/uuid";

export const dynamic = "force-dynamic";
export const revalidate = 0;


type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPersonPage({ params }: RouteParams) {
  const { id } = await params;
  const person = await getPersonById(id);
  if (!person) {
    notFound();
  }
  const personIdValid = isUuid(person.person_id);

  return (
    <div className="space-y-6">
      <PageHeader title="Editar pessoa" description="Atualize dados do colaborador." />
      <div className="rounded-lg border border-border bg-card p-6">
        <PersonForm
          mode="edit"
          personId={person.person_id}
          initialValues={{
            nome: person.nome,
            chapa_matricula: person.chapa_matricula,
            marca: person.marca,
            unidade: person.unidade,
            status: person.status as "ATIVO" | "INATIVO",
          }}
        />
      </div>
      {!personIdValid ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          O person_id desta pessoa nao parece ser um UUID valido. Confira se a
          coluna <strong> person_id</strong> no Sheets esta formatada como texto e
          contem o valor completo com hifens.
        </div>
      ) : null}
    </div>
  );
}
