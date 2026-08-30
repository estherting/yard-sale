import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export async function sendReservationNotification(item: {
  title: string;
  price: number;
  reservedBy: string;
  reservedEmail: string;
}) {
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Yard Sale <onboarding@resend.dev>",
    to: ADMIN_EMAIL,
    subject: `Item Reserved: ${item.title}`,
    html: `
      <h2>${item.title} has been reserved!</h2>
      <p><strong>Price:</strong> $${item.price.toFixed(2)}</p>
      <p><strong>Reserved by:</strong> ${item.reservedBy}</p>
      <p><strong>Email:</strong> ${item.reservedEmail}</p>
      <p>Log in to the <a href="${process.env.APP_URL || "http://localhost:3000"}/admin">admin page</a> to manage this reservation.</p>
    `,
  });
}

export async function sendWaitlistNotification(item: {
  title: string;
  price: number;
  name: string;
  email: string | null;
}) {
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Yard Sale <onboarding@resend.dev>",
    to: ADMIN_EMAIL,
    subject: `Waitlist: ${item.name} wants ${item.title}`,
    html: `
      <h2>Someone joined the waitlist for ${item.title}</h2>
      <p><strong>Price:</strong> $${item.price.toFixed(2)}</p>
      <p><strong>Name:</strong> ${item.name}</p>
      ${item.email ? `<p><strong>Email:</strong> ${item.email}</p>` : ""}
      <p>Log in to the <a href="${process.env.APP_URL || "http://localhost:3000"}/admin">admin page</a> to view the waitlist.</p>
    `,
  });
}
