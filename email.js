require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReminderEmail(habits) {
  const list = habits.map(h => `• ${h.name}${h.description ? ': ' + h.description : ''}`).join('\n');
  await transporter.sendMail({
    from: `"Habit Tracker" <${process.env.EMAIL_USER}>`,
    to: process.env.REMINDER_TO,
    subject: `Recordatorio: tienes ${habits.length} hábito(s) pendiente(s)`,
    text: `Hola! Estos son tus hábitos pendientes para hoy:\n\n${list}\n\nAbre la app en http://localhost:${process.env.PORT || 3000} para marcarlos.`,
    html: `
      <h2>Habitos pendientes para hoy</h2>
      <ul>${habits.map(h => `<li><strong>${h.name}</strong>${h.description ? ' — ' + h.description : ''}</li>`).join('')}</ul>
      <p><a href="http://localhost:${process.env.PORT || 3000}">Abrir la app</a></p>
    `,
  });
}

module.exports = { sendReminderEmail };
