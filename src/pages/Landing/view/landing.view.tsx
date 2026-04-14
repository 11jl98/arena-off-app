import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Coins, 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  Shield,
  Zap,
  Trophy,
  ArrowRight,
  Phone,
  Mail,
  Instagram,
  Facebook
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ROUTES } from '@/utils/constants/app.constant';

export function LandingView() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate(ROUTES.LOGIN);
  };

  const features = [
    {
      icon: Calendar,
      title: 'Reservas Online',
      description: 'Agende sua quadra em segundos, 24h por dia com confirmação instantânea',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      icon: Coins,
      title: 'Cashback Automático',
      description: 'Ganhe 5% de volta em cada consumo no bar. Acumule e use nas suas reservas',
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    {
      icon: Star,
      title: 'Promoções Exclusivas',
      description: 'Aproveite horários promocionais e ganhe horas bônus nas suas reservas',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  const benefits = [
    { icon: Shield, text: 'Pagamento seguro' },
    { icon: Clock, text: 'Disponível 24/7' },
    { icon: Users, text: 'Compartilhe com amigos' },
    { icon: Zap, text: 'Resposta instantânea' }
  ];

  return (
    <div className="min-h-dvh bg-linear-to-b from-slate-50 to-white ">
      <div className="relative overflow-hidden bg-linear-to-br from-[#FF8424] via-[#FF6B35] to-[#ff5922]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-white/30 blur-2xl" />
                <img
                  src="/logo.jpg"
                  alt="Arena Off Beach"
                  className="relative h-12 w-12 rounded-xl object-cover shadow-lg ring-2 ring-white/20"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-white drop-shadow-lg">
                Arena Off Beach
              </span>
            </div>
            <Button
              onClick={handleLoginClick}
              variant="secondary"
              className="rounded-xl bg-white/90 font-bold text-[#ff5922] backdrop-blur-sm transition-all hover:scale-105 hover:bg-white"
            >
              Entrar
            </Button>
          </div>

          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Sua arena na palma da mão</span>
            </div>
            
            <h1 className="mb-4 text-4xl font-black tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
              Reserve quadras,<br />
              ganhe cashback
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 drop-shadow md:text-xl">
              A melhor experiência em reservas de quadras de beach sports.<br />
              Simples, rápido e com recompensas em cada visita.
            </p>
            
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                onClick={handleLoginClick}
                size="lg"
                className="gap-2 rounded-2xl bg-white py-6 text-base font-bold text-[#ff5922] shadow-2xl transition-all hover:scale-105 hover:bg-white"
              >
                <Calendar className="h-5 w-5" />
                Começar Agora
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 rounded-2xl border-2 border-white/30 bg-transparent py-6 text-base font-bold text-white backdrop-blur-sm hover:bg-white/10"
                onClick={() => {
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Saiba Mais
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/90">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <benefit.icon className="h-5 w-5" />
                  <span className="text-sm font-medium drop-shadow">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="-mt-32 mb-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden rounded-3xl border-0 bg-white p-8 shadow-xl transition-all hover:shadow-2xl"
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bgColor}`}>
                <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r ${feature.color} opacity-0 transition-opacity group-hover:opacity-100`} />
            </Card>
          ))}
        </div>

        <div className="mb-20 overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 to-slate-800 p-12 text-center shadow-2xl">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white">Pronto para jogar?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-slate-300">
            Faça sua reserva agora e comece a acumular cashback em cada visita.<br />
            Use seus pontos para descontos nas próximas reservas.
          </p>
          <Button
            onClick={handleLoginClick}
            size="lg"
            className="gap-2 rounded-2xl bg-[#ff5922] py-6 text-base font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-[#FF6B35]"
          >
            <Calendar className="h-5 w-5" />
            Fazer Reserva
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Como funciona?</h2>
            <div className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'Faça login com Google',
                  description: 'Acesso rápido e seguro em segundos'
                },
                {
                  step: '2',
                  title: 'Escolha sua quadra',
                  description: 'Veja disponibilidade em tempo real'
                },
                {
                  step: '3',
                  title: 'Reserve e jogue',
                  description: 'Confirme e aproveite sua partida'
                },
                {
                  step: '4',
                  title: 'Ganhe cashback',
                  description: 'Acumule pontos em cada consumo'
                }
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#FF8424] to-[#ff5922] font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Localização</h2>
            <Card className="overflow-hidden rounded-3xl border-0 shadow-lg">
              <div className="h-48 bg-linear-to-br from-slate-200 to-slate-300">
                <div className="flex h-full items-center justify-center">
                  <MapPin className="h-16 w-16 text-slate-400" />
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#ff5922]" />
                  <div>
                    <p className="font-medium text-slate-900">Arena Off Beach</p>
                    <p className="text-sm text-slate-600">
                      Praia do Futuro - Fortaleza, CE
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4" />
                    <span>(85) 99999-0000</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4" />
                    <span>contato@arenaoffbeach.com</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <footer className="bg-slate-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff5922]">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">Arena Off Beach</span>
              </div>
              <p className="text-sm text-slate-400">
                A melhor experiência em reservas de quadras de beach sports
              </p>
            </div>
            
            <div>
              <h4 className="mb-3 font-semibold">Navegação</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <button onClick={handleLoginClick} className="block hover:text-white">
                  Fazer Login
                </button>
                <button 
                  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                  className="block hover:text-white"
                >
                  Sobre
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="mb-3 font-semibold">Redes Sociais</h4>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/arenaoffbeach"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://facebook.com/arenaoffbeach"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} Arena Off Beach. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
