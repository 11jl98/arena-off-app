import { APP_NAME, APP_VERSION } from '@/utils/constants/app.constant';

export const SplashScreen = () => {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-linear-to-b from-[#FF8424] to-[#FF5722]"
      style={{ zIndex: 9999 }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <img
          src="/logo.jpg"
          alt={APP_NAME}
          className="w-32 h-32 rounded-3xl shadow-2xl object-cover"
        />

        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-white tracking-tight">{APP_NAME}</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-white/80">© 2026 João Luiz | {APP_VERSION}</p>
      </div>
    </div>
  );
};
