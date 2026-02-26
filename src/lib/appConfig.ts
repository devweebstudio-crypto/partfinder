const env = import.meta.env

export const appName = env.VITE_APP_NAME || 'PartFinder'

const currentYear = new Date().getFullYear()
const rawFooterText = env.VITE_APP_FOOTER_TEXT || `© ${currentYear} ${appName}`

export const footerText = rawFooterText.replace('{year}', String(currentYear))
