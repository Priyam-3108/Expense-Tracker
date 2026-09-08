import { LogoMark } from './Logo'

/**
 * Shared split-screen shell for the auth pages (Login, Register,
 * ForgotPassword, ResetPassword).
 *
 *  - Left  : deep-indigo panel with brand + value copy (desktop only)
 *  - Right : the form, centred, max-width capped by `formWidth`
 *
 * Props:
 *   eyebrow, headline, subcopy  — left-panel copy (headline accepts JSX)
 *   panelChildren               — optional extra content under the subcopy
 *   footerNote                  — small print pinned to the panel bottom
 *   formWidth                   — 'md' (default) | 'lg' for the wider Register form
 *   children                    — the form / right-column content
 */
const AuthLayout = ({
    eyebrow,
    headline,
    subcopy,
    panelChildren,
    footerNote = `© ${new Date().getFullYear()} Spendly. Your data stays private.`,
    formWidth = 'md',
    children,
}) => {
    const maxW = formWidth === 'lg' ? 'max-w-xl' : 'max-w-md'

    return (
        <div className="min-h-screen flex relative overflow-hidden gradient-mesh-bg">
            {/* ── Left panel — decorative (desktop only) ── */}
            <div className="hidden lg:flex lg:w-[48%] xl:w-[45%] flex-col justify-between p-14 relative overflow-hidden panel-gradient-indigo">
                {/* Decorative orbs */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/[0.05]" />
                <div className="pointer-events-none absolute bottom-[10%] -left-16 w-60 h-60 rounded-full bg-ruby/[0.15]" />
                <div className="pointer-events-none absolute top-[40%] right-[5%] w-44 h-44 rounded-full bg-primary-200/[0.08]" />

                {/* Brand */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.14] border border-white/20 shadow-lg">
                        <LogoMark size={20} />
                    </div>
                    <span className="text-white font-semibold text-lg tracking-tight">Spendly</span>
                </div>

                {/* Headline block */}
                <div className="relative z-10">
                    {eyebrow && (
                        <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">{eyebrow}</p>
                    )}
                    <h2 className="text-4xl xl:text-5xl font-light text-white tracking-tight leading-tight mb-6">
                        {headline}
                    </h2>
                    {subcopy && (
                        <p className="text-white/60 text-lg leading-relaxed max-w-sm">{subcopy}</p>
                    )}
                    {panelChildren}
                </div>

                <p className="text-white/30 text-xs relative z-10">{footerNote}</p>
            </div>

            {/* ── Right panel — form ── */}
            <div className="flex flex-1 items-center justify-center py-12 px-6 lg:px-14">
                <div className={`w-full ${maxW}`}>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default AuthLayout
