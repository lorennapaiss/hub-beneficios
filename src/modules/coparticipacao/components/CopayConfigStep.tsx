import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CopayConfig } from "@/modules/coparticipacao/types/copay.types";

type CopayConfigStepProps = {
  config: CopayConfig;
  onChange: (next: CopayConfig) => void;
};

export function CopayConfigStep({ config, onChange }: CopayConfigStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Parametrizacao</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="competencia">Competencia / data base</Label>
          <Input
            id="competencia"
            type="date"
            value={config.competencia}
            onChange={(event) =>
              onChange({
                ...config,
                competencia: event.target.value,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="operadora">Operadora</Label>
          <Select
            id="operadora"
            value={config.operadora}
            onChange={(event) =>
              onChange({
                ...config,
                operadora: event.target.value as CopayConfig["operadora"],
              })
            }
          >
            <option value="UNIMED">Unimed</option>
            <option value="SULAMERICA">SulAmerica</option>
            <option value="AMIL">Amil</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="formato-data">Formato da data no TXT</Label>
          <Select
            id="formato-data"
            value={config.formato_data}
            onChange={(event) =>
              onChange({
                ...config,
                formato_data: event.target.value as CopayConfig["formato_data"],
              })
            }
          >
            <option value="DDMMAAAA">DDMMAAAA</option>
            <option value="DD/MM/AAAA">DD/MM/AAAA</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="threshold">Threshold de similaridade</Label>
          <Input
            id="threshold"
            type="number"
            min="0.5"
            max="1"
            step="0.01"
            value={config.similarity_threshold}
            onChange={(event) =>
              onChange({
                ...config,
                similarity_threshold: Number(event.target.value || "0.82"),
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
