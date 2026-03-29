import { PageHeader } from "@/components/page-header";
import { PersonForm } from "@/components/people/person-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function NewPersonPage() {
  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Cadastro mestre"
        title="Nova pessoa"
        description="Crie um novo cadastro com dados operacionais consistentes para alocações e consultas."
      />
      <div className="section-panel subtle-ring p-6 sm:p-8">
        <PersonForm mode="create" />
      </div>
    </div>
  );
}
