import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploadCard } from "@/modules/coparticipacao/components/FileUploadCard";

type CopayUploadStepProps = {
  collaboratorFile: File | null;
  copayFile: File | null;
  onCollaboratorFileSelect: (file: File | null) => void;
  onCopayFileSelect: (file: File | null) => void;
  error: string | null;
};

export function CopayUploadStep({
  collaboratorFile,
  copayFile,
  onCollaboratorFileSelect,
  onCopayFileSelect,
  error,
}: CopayUploadStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Upload dos arquivos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <FileUploadCard
            title="Base de colaboradores"
            description="Arquivo obrigatorio para localizar a chapa e validar elegibilidade."
            file={collaboratorFile}
            onFileSelect={onCollaboratorFileSelect}
          />
          <FileUploadCard
            title="Planilha de coparticipacao"
            description="Arquivo com titular, beneficiario, valor, sinal e referencia."
            file={copayFile}
            onFileSelect={onCopayFileSelect}
          />
        </div>
        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
