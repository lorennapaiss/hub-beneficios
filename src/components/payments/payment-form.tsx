"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { useRouter } from "next/navigation";
import { PaymentBaseSchema, PaymentStatusEnum } from "@/lib/schema";
import { useApi } from "@/lib/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DatePicker from "@/components/payments/date-picker";
import CurrencyInput from "@/components/payments/currency-input";
import { Separator } from "@/components/ui/separator";

const createSchema = PaymentBaseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  paid_at: true,
  paid_by: true,
})
  .extend({
    status: PaymentStatusEnum.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider === "Outro" && !data.provider_custom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "provider_custom e obrigatorio quando provider=Outro",
        path: ["provider_custom"],
      });
    }
  });

const editSchema = PaymentBaseSchema.pick({
  ticket_number: true,
  ticket_sent_date: true,
  due_date: true,
  amount: true,
  brand: true,
  notes: true,
  owner_name: true,
  owner_email: true,
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type FormValues = CreateValues & EditValues;

type Mode = "create" | "edit";

type PaymentFormProps = {
  mode: Mode;
  paymentId?: string;
  initialValues?: Partial<FormValues>;
};

type UploadResult = { data: { drive_link?: string } } | null;

export default function PaymentForm({
  mode,
  paymentId,
  initialValues,
}: PaymentFormProps) {
  const router = useRouter();
  const { request, uploadWithProgress } = useApi();
  const { pushToast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const resolver = useMemo(() => {
    return zodResolver(
      mode === "create" ? createSchema : editSchema,
    ) as unknown as Resolver<FormValues>;
  }, [mode]);

  const form = useForm<FormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {
      category: "PlanoSaude",
      brand: "",
      provider: "Unimed",
      subtype: "Saude",
      status: "RASCUNHO",
      ...initialValues,
    } as FormValues,
  });

  useEffect(() => {
    if (mode === "edit" && initialValues) {
      form.reset(initialValues as FormValues);
    }
  }, [form, initialValues, mode]);

  const provider = form.watch("provider");

  const handleUpload = async (id: string) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = (await uploadWithProgress(
        `/api/payments/${id}/upload-boleto`,
        formData,
        setUploadProgress,
      )) as UploadResult;
      const link = result?.data?.drive_link ?? null;
      if (link) {
        setDriveLink(link);
      }
      return result;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      if (mode === "create") {
        const response = await request<{ data: { id: string } }>("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values as CreateValues),
        });

        if (file) {
          await handleUpload(response.data.id);
        }

        pushToast({
          title: "Pagamento criado",
          description: "Registro salvo com sucesso.",
          variant: "success",
        });
        router.push(`/beneficios/pagamentos/${response.data.id}`);
        return;
      }

      if (!paymentId) return;

      await request(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values as EditValues),
      });

      pushToast({
        title: "Pagamento atualizado",
        description: "Alteracoes salvas.",
        variant: "success",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {mode === "create" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-lg border bg-card p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold">Dados do beneficio</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select {...form.register("category")}>
                  <option value="PlanoSaude">Plano de saude</option>
                  <option value="VT">VT</option>
                  <option value="VA">VA</option>
                  <option value="ExameOcupacional">Exame ocupacional</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input {...form.register("brand")} placeholder="Ex: Marca X" />
                {form.formState.errors.brand ? (
                  <p className="text-xs text-rose-500">
                    {form.formState.errors.brand.message as string}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select {...form.register("provider")}>
                  <option value="Unimed">Unimed</option>
                  <option value="SulAmerica">SulAmerica</option>
                  <option value="Amil">Amil</option>
                  <option value="Outro">Outro</option>
                </Select>
              </div>
              {provider === "Outro" ? (
                <div className="space-y-2 md:col-span-2">
                  <Label>Fornecedor (custom)</Label>
                  <Input
                    {...form.register("provider_custom")}
                    placeholder="Digite o fornecedor"
                  />
                  {form.formState.errors.provider_custom ? (
                    <p className="text-xs text-rose-500">
                      {form.formState.errors.provider_custom.message as string}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Subtipo</Label>
                <Select {...form.register("subtype")}>
                  <option value="Saude">Saude</option>
                  <option value="Odonto">Odonto</option>
                  <option value="NA">NA</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Competencia</Label>
                <Input {...form.register("competence")} placeholder="2026-01" />
              </div>
              <div className="space-y-2">
                <Label>Numero do ticket</Label>
                <Input {...form.register("ticket_number")} />
                {form.formState.errors.ticket_number ? (
                  <p className="text-xs text-rose-500">
                    {form.formState.errors.ticket_number.message as string}
                  </p>
                ) : null}
              </div>
              <DatePicker
                label="Data de envio"
                value={form.watch("ticket_sent_date")}
                onChange={(value) =>
                  form.setValue("ticket_sent_date", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.ticket_sent_date ? (
                <p className="text-xs text-rose-500">
                  {form.formState.errors.ticket_sent_date.message as string}
                </p>
              ) : null}
              <DatePicker
                label="Vencimento"
                value={form.watch("due_date")}
                onChange={(value) =>
                  form.setValue("due_date", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.due_date ? (
                <p className="text-xs text-rose-500">
                  {form.formState.errors.due_date.message as string}
                </p>
              ) : null}
              <CurrencyInput
                label="Valor"
                value={form.watch("amount") as number | undefined}
                onChange={(value) =>
                  form.setValue("amount", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Responsavel</h2>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input {...form.register("owner_name")} />
              {form.formState.errors.owner_name ? (
                <p className="text-xs text-rose-500">
                  {form.formState.errors.owner_name.message as string}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("owner_email")} />
              {form.formState.errors.owner_email ? (
                <p className="text-xs text-rose-500">
                  {form.formState.errors.owner_email.message as string}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Boleto</Label>
              <Input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              {uploading ? (
                <p className="text-xs text-muted-foreground">
                  Upload: {uploadProgress}%
                </p>
              ) : null}
              {driveLink ? (
                <a
                  className="text-xs text-blue-600 underline"
                  href={driveLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir boleto
                </a>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea {...form.register("notes")} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Editar pagamento</h2>
          <Separator className="my-4" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Numero do ticket</Label>
              <Input {...form.register("ticket_number")} />
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input {...form.register("brand")} placeholder="Ex: Marca X" />
            </div>
            <DatePicker
              label="Data de envio"
              value={form.watch("ticket_sent_date")}
              onChange={(value) =>
                form.setValue("ticket_sent_date", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <DatePicker
              label="Vencimento"
              value={form.watch("due_date")}
              onChange={(value) =>
                form.setValue("due_date", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <CurrencyInput
              label="Valor"
              value={form.watch("amount") as number | undefined}
              onChange={(value) =>
                form.setValue("amount", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <div className="space-y-2">
              <Label>Responsavel</Label>
              <Input {...form.register("owner_name")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("owner_email")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observacoes</Label>
              <Textarea {...form.register("notes")} />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          className="bg-muted text-foreground hover:bg-muted/80"
          type="button"
          disabled={saving}
          onClick={() => form.reset()}
        >
          Limpar
        </Button>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

