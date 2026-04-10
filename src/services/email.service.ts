import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

interface SendPasswordResetEmailParams {
  to: string
  nombre: string
  resetToken: string
}

export async function sendPasswordResetEmail({
  to,
  nombre,
  resetToken,
}: SendPasswordResetEmailParams) {
  const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/reset-password?token=${resetToken}`
  
  // En staging/pruebas, enviar a TEST_EMAIL. En producción, enviar al email real del usuario
  const emailDestino = process.env.TEST_EMAIL ?? to
  
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailDestino,
      subject: 'Recuperación de contraseña - LOGISTRANS',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperar contraseña</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #1e40af; padding: 32px 30px; text-align: center;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <img src="https://res.cloudinary.com/dwm3jwkwv/image/upload/v1775854633/logistrans/logo.png" 
                                   alt="LOGISTRANS" 
                                   style="height: 48px; width: auto; margin-bottom: 12px;" />
                            </td>
                          </tr>
                          <tr>
                            <td align="center">
                              <p style="margin: 0; color: #dbeafe; font-size: 14px; font-weight: 500;">
                                Servicio de Transporte
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px; font-weight: 600;">
                          Recuperar contraseña
                        </h2>
                        
                        <p style="margin: 0 0 16px; color: #1e293b; font-size: 15px;">
                          Hola <strong>${nombre}</strong>,
                        </p>
                        
                        <p style="margin: 0 0 24px; color: #64748b; font-size: 15px; line-height: 1.6;">
                          Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña:
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${resetUrl}" 
                                 style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 600;">
                                Restablecer contraseña
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
                          O copia y pega este enlace en tu navegador:
                        </p>
                        
                        <div style="background-color: #f1f5f9; border-radius: 6px; padding: 12px; margin-bottom: 24px; word-break: break-all;">
                          <a href="${resetUrl}" style="color: #1e40af; font-size: 13px; text-decoration: none;">
                            ${resetUrl}
                          </a>
                        </div>
                        
                        <!-- Info Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 24px;">
                          <tr>
                            <td style="padding: 16px;">
                              <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">
                                ⏱️ Importante
                              </p>
                              <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
                                Este enlace expirará en 1 hora por seguridad. Si no solicitaste este cambio, puedes ignorar este correo.
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                          Si tienes problemas, contacta al administrador del sistema.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-align: center;">
                          © ${new Date().getFullYear()} LOGISTRANS S.A. Todos los derechos reservados.
                        </p>
                        <p style="margin: 0; color: #cbd5e1; font-size: 11px; text-align: center;">
                          Este es un correo automático, por favor no responder.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error enviando email con Resend:', error)
      throw new Error('Error al enviar el email')
    }

    console.log('Email de recuperación enviado exitosamente:', data)
    return data
  } catch (error) {
    console.error('Error en sendPasswordResetEmail:', error)
    throw error
  }
}


