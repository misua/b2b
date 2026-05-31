// Shared HTML email shell — inline styles for maximum mail client compat

export function emailShell(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>B2B Sourcing Portal</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <div style="display:inline-flex;align-items:center;background:#ffffff;border-radius:8px;padding:6px 12px;font-size:14px;font-weight:700;color:#18181b;letter-spacing:-0.5px;">B2B</div>
                  </td>
                  <td align="right" style="color:#a1a1aa;font-size:13px;">Sourcing Portal</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          ${content}

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:24px 32px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#71717a;line-height:1.6;">
                This is an automated notification from B2B Sourcing Portal.<br />
                If you have questions, contact your account manager directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Reusable button HTML
export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.1px;">${label}</a>`;
}

// Reusable cost row
export function costRow(label: string, value: string, isBold = false): string {
  const style = isBold
    ? "font-weight:700;font-size:15px;border-top:2px solid #e4e4e7;padding-top:12px;margin-top:4px;"
    : "color:#52525b;font-size:14px;padding:4px 0;";
  return `
    <tr>
      <td style="${style}">${label}</td>
      <td align="right" style="${style} text-align:right;">${value}</td>
    </tr>`;
}
