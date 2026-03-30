"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { AppUserRole, getAppUserRoleLabel } from "@/lib/user-access";

type ManagedUser = {
  id: string;
  email: string;
  fullName: string;
  accessRole: AppUserRole;
  brands: string[];
  status: "active" | "access-only";
  mustChangePassword: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
};

type UserManagementProps = {
  initialUsers: ManagedUser[];
  loadError?: string | null;
};

type FormState = {
  fullName: string;
  email: string;
  accessRole: AppUserRole;
  brands: string;
  temporaryPassword: string;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  accessRole: "BENEFITS_ASSISTANT",
  brands: "ALL",
  temporaryPassword: "",
};

const statusLabel: Record<ManagedUser["status"], string> = {
  active: "Ativo",
  "access-only": "Sem auth",
};

const formatDate = (value: string | null) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

export function UserManagement({ initialUsers, loadError }: UserManagementProps) {
  const { pushToast } = useToast();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [users, setUsers] = useState(initialUsers);
  const [currentError, setCurrentError] = useState(loadError ?? "");
  const [isSubmitting, startSubmitting] = useTransition();
  const [isRefreshing, startRefreshing] = useTransition();

  const refreshUsers = () => {
    startRefreshing(async () => {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: ManagedUser[];
      };

      if (!response.ok || !payload.ok || !payload.data) {
        const message = payload.error ?? "Nao foi possivel recarregar os usuarios.";
        setCurrentError(message);
        pushToast({
          variant: "error",
          title: "Falha ao recarregar",
          description: message,
        });
        return;
      }

      setUsers(payload.data);
      setCurrentError("");
    });
  };

  const handleEditUser = (user: ManagedUser) => {
    setEditingUserId(user.id);
    setCurrentError("");
    setForm({
      fullName: user.fullName || "",
      email: user.email,
      accessRole: user.accessRole,
      brands: user.brands.join("\n"),
      temporaryPassword: "",
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setCurrentError("");
    setForm(initialFormState);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startSubmitting(async () => {
      setCurrentError("");

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: { message?: string };
      };

      if (!response.ok || !payload.ok) {
        const message = payload.error ?? "Nao foi possivel cadastrar o usuario.";
        setCurrentError(message);
        pushToast({
          variant: "error",
          title: "Cadastro nao salvo",
          description: message,
        });
        return;
      }

      pushToast({
        variant: "success",
        title: editingUserId ? "Usuario atualizado" : "Usuario cadastrado",
        description:
          payload.data?.message ??
          "Usuario salvo com senha provisoria e permissoes atualizadas.",
      });
      setEditingUserId(null);
      setForm(initialFormState);
      refreshUsers();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{editingUserId ? "Editar usuario" : "Novo usuario"}</CardTitle>
            <CardDescription>
              {editingUserId
                ? "Atualize perfil e marcas. Se preencher uma nova senha provisoria, o usuario sera obrigado a trocar no proximo login."
                : "Defina uma senha provisoria no cadastro. No primeiro login, o usuario sera obrigado a trocar essa senha antes de acessar os modulos."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  placeholder="Ex.: Ana Souza"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="nome@empresa.com"
                  disabled={Boolean(editingUserId)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessRole">Perfil de acesso</Label>
                <Select
                  id="accessRole"
                  value={form.accessRole}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      accessRole: event.target.value as AppUserRole,
                      brands:
                        event.target.value === "BRAND"
                          ? current.brands === "ALL"
                            ? ""
                            : current.brands
                          : current.brands || "ALL",
                    }))
                  }
                >
                  <option value="ADMIN">ADM</option>
                  <option value="BENEFITS_ASSISTANT">Assistente de Beneficios</option>
                  <option value="BRAND">Marcas</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temporaryPassword">Senha provisoria</Label>
                <Input
                  id="temporaryPassword"
                  type="text"
                  value={form.temporaryPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      temporaryPassword: event.target.value,
                    }))
                  }
                  placeholder={
                    editingUserId ? "Deixe em branco para manter a senha atual" : "Minimo de 8 caracteres"
                  }
                  required={!editingUserId}
                />
                <p className="text-xs text-muted-foreground">
                  {editingUserId
                    ? "Se preencher, o sistema passa a exigir troca de senha no proximo login."
                    : "Entregue essa senha ao usuario. No primeiro acesso, o sistema vai exigir a troca."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brands">
                  {form.accessRole === "BRAND" ? "Marcas permitidas" : "Escopo de marcas"}
                </Label>
                <Textarea
                  id="brands"
                  value={form.brands}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, brands: event.target.value }))
                  }
                  rows={5}
                  placeholder={
                    form.accessRole === "BRAND"
                      ? "Informe uma marca por linha"
                      : "Use ALL para todas as marcas\nou uma marca por linha"
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {form.accessRole === "BRAND"
                    ? "Usuario de Marcas fica restrito ao modulo de indicadores e as marcas informadas aqui."
                    : "Use ALL para acesso global ou informe uma marca por linha."}
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Salvando..."
                    : editingUserId
                      ? "Salvar alteracoes"
                      : "Cadastrar usuario"}
                </Button>
                {editingUserId ? (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Usuarios cadastrados</CardTitle>
              <CardDescription>
                A lista junta usuarios do Supabase Auth com as permissoes salvas na tabela
                de acesso por marcas.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={refreshUsers} disabled={isRefreshing}>
              {isRefreshing ? "Atualizando..." : "Recarregar"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {currentError}
              </div>
            ) : null}

            <div className="rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Marcas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ultimo acesso</TableHead>
                    <TableHead>Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum usuario cadastrado ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{user.fullName || "Sem nome"}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground">
                              Criado em {formatDate(user.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{getAppUserRoleLabel(user.accessRole)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {user.brands.map((brand) => (
                              <Badge key={`${user.id}:${brand}`} className="bg-background">
                                {brand}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className="bg-background">{statusLabel[user.status]}</Badge>
                            {user.mustChangePassword ? (
                              <div className="text-xs text-amber-700">
                                Troca de senha pendente
                              </div>
                            ) : null}
                            {user.emailConfirmedAt ? (
                              <div className="text-xs text-muted-foreground">
                                Confirmado em {formatDate(user.emailConfirmedAt)}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.lastSignInAt)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Perfis disponiveis: ADM com acesso total, Assistente de Beneficios com acesso
              operacional sem admin, e Marcas com acesso apenas a Indicadores filtrados pelas
              marcas cadastradas. Todos entram com senha provisoria e trocam no primeiro acesso.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
