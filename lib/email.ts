import nodemailer from "nodemailer";

// Outbound via SMTP — funciona com qualquer provedor (Gmail com senha de app,
// Outlook, SES, etc.), não depende do Gmail MCP (que só ajuda o assistente
// nesta sessão, não roda dentro do app em produção).
function getTransport() {
  const { EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS } = process.env;
  if (!EMAIL_SMTP_HOST || !EMAIL_SMTP_USER || !EMAIL_SMTP_PASS) {
    throw new Error(
      "Credenciais de e-mail não configuradas — defina EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER e EMAIL_SMTP_PASS em .env"
    );
  }
  return nodemailer.createTransport({
    host: EMAIL_SMTP_HOST,
    port: Number(EMAIL_SMTP_PORT ?? 587),
    secure: Number(EMAIL_SMTP_PORT ?? 587) === 465,
    auth: { user: EMAIL_SMTP_USER, pass: EMAIL_SMTP_PASS },
  });
}

export async function enviarEmail(params: { to: string; subject: string; texto: string; emResposta?: string }) {
  const transport = getTransport();
  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.EMAIL_SMTP_USER,
    to: params.to,
    subject: params.emResposta ? `Re: ${params.emResposta}` : params.subject,
    text: params.texto,
  });
}
