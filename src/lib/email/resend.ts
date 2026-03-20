import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY ?? "");
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

interface AlertEmailData {
  to: string;
  ticker: string;
  symbolName: string;
  direction: string;
  threshold: number;
  triggeredPrice: number;
  triggeredAt: Date;
}

export async function sendAlertEmail(data: AlertEmailData): Promise<boolean> {
  const directionLabel = data.direction === "above" ? "sopra" : "sotto";
  const subject = `Alert ${data.ticker}: prezzo ${directionLabel} ${data.threshold.toFixed(2)}`;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333;">Alert Attivato</h2>
          <p>Il tuo alert su <strong>${data.ticker}</strong> (${data.symbolName}) si è attivato.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Direzione</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${directionLabel === "sopra" ? "↑ Sopra" : "↓ Sotto"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Soglia</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.threshold.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Prezzo trigger</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${data.triggeredPrice.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px; color: #666;">Timestamp</td><td style="padding: 8px;">${data.triggeredAt.toLocaleString("it-IT")}</td></tr>
          </table>
          <p style="color: #999; font-size: 12px;">StockAI — Alert di prezzo</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send alert email:", error);
    return false;
  }
}

export async function sendAlertNotification(
  userId: string,
  alertId: string,
  emailData: AlertEmailData
): Promise<void> {
  // Check deduplication
  const existing = await prisma.emailNotification.findUnique({
    where: { alertId },
  });
  if (existing) return;

  // Check user preference
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailNotifications: true },
  });
  if (!user?.emailNotifications) return;

  const sent = await sendAlertEmail(emailData);

  if (sent) {
    try {
      await prisma.emailNotification.create({
        data: { userId, alertId },
      });
    } catch {
      // Unique constraint — already sent (race condition)
    }
  }
}
