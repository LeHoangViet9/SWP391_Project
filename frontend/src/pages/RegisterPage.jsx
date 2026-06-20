import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';

const PHONE_RE = /^(0|\+84)\d{9}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&+=!]{6,}$/;

export default function RegisterPage() {
    const { t, locale } = useLocale();
    const { register } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') || '/login';

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        rePassword: '',
    });

    const [showPass, setShowPass] = useState(false);
    const [showRePass, setShowRePass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const update = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        // Kiểm tra blank/whitespace-only
        if (!form.fullName.trim()) return locale === 'vi' ? 'Họ và tên không được để trống.' : 'Full name is required.';
        if (!form.email.trim()) return locale === 'vi' ? 'Email không được để trống.' : 'Email is required.';
        if (!form.phone.trim()) return locale === 'vi' ? 'Số điện thoại không được để trống.' : 'Phone number is required.';
        if (!form.password) return locale === 'vi' ? 'Mật khẩu không được để trống.' : 'Password is required.';
        if (!form.rePassword) return locale === 'vi' ? 'Vui lòng xác nhận mật khẩu.' : 'Please confirm your password.';
        // Kiểm tra format
        if (!PASSWORD_RE.test(form.password)) return t('auth.errPassword');
        if (form.password !== form.rePassword) return t('auth.errPasswordMatch');
        if (!PHONE_RE.test(form.phone.trim())) return t('auth.errPhone');
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const err = validate();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        try {
            // Trim whitespace trước khi gửi lên server
            const payload = {
                ...form,
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
            };
            const res = await register(payload);
            setSuccess(res.message || t('auth.registerSuccess'));

            // Sau đăng ký → về trang login với email pre-filled
            // Kèm flag "registered=1" để login hiện banner nhắc xác thực OTP
            setTimeout(() => {
                navigate(
                    `/login?email=${encodeURIComponent(payload.email)}&registered=1`
                );
            }, 1500);
        } catch (err) {
            setError(err.message || t('auth.registerFailed'));
        } finally {
            setLoading(false);
        }
    };


    const inputClass =
        'w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors';

    const labelClass =
        'block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2';

    return (
        <AuthLayout title={t('auth.register')} subtitle={t('auth.registerSubtitle')}>
            <form
                onSubmit={handleSubmit}
                className="bg-white border border-stone-200 shadow-lg p-8 space-y-4"
            >
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded">
                        {success}
                    </div>
                )}

                {/* Full Name */}
                <div>
                    <label className={labelClass}>{t('auth.fullName')}</label>
                    <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                        className={inputClass}
                    />
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            className={inputClass}
                            placeholder="example@gmail.com"
                        />
                    </div>

                    <div>
                        <label className={labelClass}>{t('auth.phone')}</label>
                        <input
                            type="tel"
                            required
                            value={form.phone}
                            onChange={(e) => update('phone', e.target.value)}
                            className={inputClass}
                            placeholder="0912345678"
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className={labelClass}>{t('auth.password')}</label>
                    <div className="relative">
                        <input
                            type={showPass ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={form.password}
                            onChange={(e) => update('password', e.target.value)}
                            className={`${inputClass} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        {t('auth.passwordHint')}
                    </p>
                </div>

                {/* Re Password */}
                <div>
                    <label className={labelClass}>{t('auth.rePassword')}</label>
                    <div className="relative">
                        <input
                            type={showRePass ? 'text' : 'password'}
                            required
                            value={form.rePassword}
                            onChange={(e) => update('rePassword', e.target.value)}
                            className={`${inputClass} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowRePass(!showRePass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            {showRePass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    <UserPlus size={18} />
                    {loading ? '...' : t('auth.register')}
                </button>

                {/* Login link */}
                <p className="text-center text-sm text-slate-500">
                    {t('auth.hasAccount')}{' '}
                    <Link
                        to="/login"
                        className="text-[#bfa15f] font-semibold hover:underline"
                    >
                        {t('auth.login')}
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}