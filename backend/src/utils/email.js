const nodemailer = require("nodemailer");

const buildTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

const sendReportEmail = async ({ to, report, pdfBuffer }) => {
  const transporter = buildTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: `Fire Safety Report - ${report.title}`,
    text: `Hi,\n\nYour fire safety report \"${report.title}\" is attached as a PDF.\n\nRegards,\nFire Safety System`,
    attachments: [
      {
        filename: `fire-report-${report._id}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });
};

module.exports = { sendReportEmail };
