import nodemailer from 'nodemailer';

const getTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
};

export const sendReservationConfirmation = async (reservation: any) => {
  const transporter = getTransporter();
  if (!transporter || !reservation.customer_email) return;

  const businessName = process.env.BUSINESS_NAME || 'Restaurante';
  const typeLabel = reservation.reservation_type === 'table' ? 'mesa' : 'mesa con pre-pedido';

  const itemsHtml = reservation.items?.length > 0
    ? `<div style="margin-top:1rem">
        <strong>🍽️ Pre-pedido:</strong>
        <ul style="margin:0.5rem 0">
          ${reservation.items.map((i: any) => `<li>${i.quantity}× ${i.product_name}</li>`).join('')}
        </ul>
       </div>`
    : '';

  await transporter.sendMail({
    from: `"${businessName}" <${process.env.SMTP_USER}>`,
    to: reservation.customer_email,
    subject: `✅ Reserva confirmada - ${businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
        <div style="background:#1a1a2e;color:white;padding:1.5rem;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="margin:0;font-size:1.5rem">🍽️ ${businessName}</h1>
        </div>
        <div style="background:white;padding:2rem;border:1px solid #eee;border-radius:0 0 12px 12px">
          <h2 style="color:#10B981;margin-top:0">¡Reserva confirmada! ✅</h2>
          <p>Hola <strong>${reservation.customer_name}</strong>,</p>
          <p>Tu reserva de <strong>${typeLabel}</strong> fue confirmada. ¡Te esperamos!</p>
          <div style="background:#f8f9fa;padding:1.25rem;border-radius:8px;margin:1.5rem 0">
            <p style="margin:0.4rem 0"><strong>📅 Fecha:</strong> ${formatDate(reservation.date)}</p>
            <p style="margin:0.4rem 0"><strong>🕐 Hora:</strong> ${reservation.time.slice(0,5)}</p>
            <p style="margin:0.4rem 0"><strong>👥 Personas:</strong> ${reservation.people_count}</p>
            ${reservation.notes ? `<p style="margin:0.4rem 0"><strong>📝 Nota:</strong> ${reservation.notes}</p>` : ''}
          </div>
          ${itemsHtml}
          <p style="color:#666;font-size:0.9rem;margin-top:2rem">Si necesitás cancelar o modificar tu reserva, contactanos.</p>
        </div>
      </div>
    `,
  });
};

export const sendNewReservationAdmin = async (reservation: any) => {
  const transporter = getTransporter();
  if (!transporter) return;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return;

  const businessName = process.env.BUSINESS_NAME || 'Restaurante';
  const typeLabel = reservation.reservation_type === 'table' ? 'Solo mesa' : 'Mesa + pre-pedido';

  await transporter.sendMail({
    from: `"${businessName}" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `📅 Nueva reserva de ${reservation.customer_name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
        <div style="background:#1a1a2e;color:white;padding:1.5rem;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="margin:0;font-size:1.3rem">🍽️ ${businessName} — Nueva reserva</h1>
        </div>
        <div style="background:white;padding:2rem;border:1px solid #eee;border-radius:0 0 12px 12px">
          <h2 style="margin-top:0;color:#F59E0B">📅 Reserva pendiente de confirmación</h2>
          <div style="background:#f8f9fa;padding:1.25rem;border-radius:8px;margin-bottom:1rem">
            <p style="margin:0.4rem 0"><strong>👤 Cliente:</strong> ${reservation.customer_name}</p>
            ${reservation.customer_email ? `<p style="margin:0.4rem 0"><strong>📧 Email:</strong> ${reservation.customer_email}</p>` : ''}
            ${reservation.customer_phone ? `<p style="margin:0.4rem 0"><strong>📱 Teléfono:</strong> ${reservation.customer_phone}</p>` : ''}
            <p style="margin:0.4rem 0"><strong>📅 Fecha:</strong> ${formatDate(reservation.date)}</p>
            <p style="margin:0.4rem 0"><strong>🕐 Hora:</strong> ${reservation.time.slice(0,5)}</p>
            <p style="margin:0.4rem 0"><strong>👥 Personas:</strong> ${reservation.people_count}</p>
            <p style="margin:0.4rem 0"><strong>Tipo:</strong> ${typeLabel}</p>
            ${reservation.notes ? `<p style="margin:0.4rem 0"><strong>📝 Notas:</strong> ${reservation.notes}</p>` : ''}
          </div>
          <p style="color:#666;font-size:0.9rem">Ingresá al panel de admin para confirmar o cancelar esta reserva.</p>
        </div>
      </div>
    `,
  });
};

export const sendReservationCancellation = async (reservation: any) => {
  const transporter = getTransporter();
  if (!transporter || !reservation.customer_email) return;

  const businessName = process.env.BUSINESS_NAME || 'Restaurante';

  await transporter.sendMail({
    from: `"${businessName}" <${process.env.SMTP_USER}>`,
    to: reservation.customer_email,
    subject: `❌ Reserva cancelada - ${businessName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1a1a2e;color:white;padding:1.5rem;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="margin:0">🍽️ ${businessName}</h1>
        </div>
        <div style="background:white;padding:2rem;border:1px solid #eee;border-radius:0 0 12px 12px">
          <h2 style="color:#EF4444;margin-top:0">Reserva cancelada ❌</h2>
          <p>Hola <strong>${reservation.customer_name}</strong>,</p>
          <p>Lamentablemente tu reserva para el <strong>${formatDate(reservation.date)}</strong> a las <strong>${reservation.time.slice(0,5)}</strong> fue cancelada.</p>
          <p style="color:#666">Si tenés alguna consulta, no dudes en contactarnos.</p>
        </div>
      </div>
    `,
  });
};
