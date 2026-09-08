import { cn } from '../utils/cn'

export const AuthError = ({ message }) =>
    message ? (
        <div className="rounded-xl p-4 bg-red-50 border border-red-200">
            <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                <span aria-hidden="true">⚠</span> {message}
            </p>
        </div>
    ) : null

const AuthSubmit = ({ loading, loadingText, children, className }) => (
    <button
        type="submit"
        disabled={loading}
        className={cn(
            'relative w-full py-3.5 px-4 rounded-2xl font-semibold text-white text-sm overflow-hidden group',
            'bg-primary-500 hover:bg-primary-600 shadow-[0_4px_20px_rgba(83,58,253,0.3)]',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200 active:scale-[0.98]',
            className
        )}
    >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 motion-reduce:hidden" />
        <span className="relative flex items-center justify-center gap-2">
            {loading ? (
                <>
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </span>
    </button>
)

export default AuthSubmit
