import PaymentForm from "@/components/payments/payment-form";

export default function NewPaymentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo pagamento</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados do boleto e do responsavel interno.
        </p>
      </div>
      <PaymentForm mode="create" />
    </div>
  );
}
