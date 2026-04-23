import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Play, CheckCircle, Calendar, Users, Clock, Monitor } from "lucide-react";

// Form field component
function FormField({
  label,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-fg-primary">
        {label} {required && <span className="text-amber-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-lg bg-noir-900 border border-noir-700 text-fg-primary placeholder:text-noir-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
      />
    </div>
  );
}

// What to expect item
function ExpectItem({
  icon: Icon,
  text,
}: {
  icon: typeof CheckCircle;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <CheckCircle className="w-4 h-4 text-amber-500" />
      </div>
      <span className="text-noir-300">{text}</span>
    </div>
  );
}

// Main DemoPage component
export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-noir-950" />
        <div className="absolute inset-0 bg-gradient-to-b from-noir-900/50 via-transparent to-noir-950" />

        <div className="relative text-center px-4">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4 text-fg-primary">
            Solicitação recebida!
          </h1>
          <p className="text-xl text-noir-400 max-w-md mx-auto mb-8">
            Nossa equipe entrará em contato em até 24 horas para agendar sua demonstração personalizada.
          </p>
          <Button asChild>
            <a href="/">Voltar ao início</a>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 bg-noir-950" />
      <div className="absolute inset-0 bg-gradient-to-b from-noir-900/50 via-transparent to-noir-950" />

      <div className="relative">
        {/* Hero section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />

          <div className="relative mx-auto max-w-4xl px-4 w-full text-center">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Demonstração
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Veja o PhishGuard{' '}
              <span className="text-amber-500">em ação</span>
            </h1>
            <p className="text-xl text-noir-300 max-w-none mx-auto">
              Agende uma demonstração personalizada e descubra como podemos proteger
              sua empresa contra phishing.
            </p>
          </div>
        </section>

        {/* Demo request section */}
        <section className="relative py-16">
          <div className="mx-auto max-w-6xl px-4 w-full">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Demo form */}
              <div className="lg:col-span-2">
                <Card className="p-8 bg-noir-900/50 border-noir-700">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl">Agende sua demonstração</CardTitle>
                    <CardDescription className="mt-2">
                      Preencha o formulário e nossa equipe entrará em contato para agendar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField label="Nome completo" placeholder="Seu nome" required />
                        <FormField label="Email corporativo" type="email" placeholder="seu@empresa.com" required />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField label="Empresa" placeholder="Nome da empresa" required />
                        <FormField label="Telefone" type="tel" placeholder="(11) 99999-9999" required />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField label="Cargo" placeholder="Seu cargo" required />
                        <FormField label="Melhor horário" placeholder="Ex: Manhãs de terça" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-fg-primary">
                          Área de interesse <span className="text-amber-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 rounded-lg bg-noir-900 border border-noir-700 text-fg-primary focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                        >
                          <option value="">Selecione uma área</option>
                          <option value="simulacao">Simulação de phishing</option>
                          <option value="treinamento">Treinamento gamificado</option>
                          <option value="relatorios">Relatórios e métricas</option>
                          <option value="integracao">Integração e API</option>
                          <option value="enterprise">Soluções enterprise</option>
                          <option value="general">Quero conhecer tudo</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-fg-primary">
                          Quantos funcionários tem sua empresa? <span className="text-amber-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 rounded-lg bg-noir-900 border border-noir-700 text-fg-primary focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                        >
                          <option value="">Selecione uma faixa</option>
                          <option value="1-10">1-10 funcionários</option>
                          <option value="11-50">11-50 funcionários</option>
                          <option value="51-200">51-200 funcionários</option>
                          <option value="201-500">201-500 funcionários</option>
                          <option value="500+">Mais de 500 funcionários</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-fg-primary">
                          Observações (opcional)
                        </label>
                        <textarea
                          placeholder="Conte-nos sobre desafios específicos ou perguntas..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-lg bg-noir-900 border border-noir-700 text-fg-primary placeholder:text-noir-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
                        />
                      </div>
                      <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? (
                          "Enviando..."
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 mr-2" />
                            Agendar demonstração
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* What to expect */}
              <div className="space-y-6">
                <Card className="p-6 bg-noir-900/50 border-noir-700">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-lg">O que você vai ver</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <ExpectItem
                      icon={Monitor}
                      text="Tour completo pela plataforma"
                    />
                    <ExpectItem
                      icon={Users}
                      text="Demonstração personalizada para seu cenário"
                    />
                    <ExpectItem
                      icon={Clock}
                      text="30 minutos + Q&A"
                    />
                    <ExpectItem
                      icon={CheckCircle}
                      text="Sem compromisso"
                    />
                  </CardContent>
                </Card>

                {/* Alternative option */}
                <Card className="p-6 bg-amber-500/10 border-amber-500/30">
                  <CardContent className="p-0">
                    <p className="text-sm text-fg-primary mb-4">
                      <span className="text-amber-500 font-semibold">Prefere assistir primeiro?</span>
                    </p>
                    <p className="text-sm text-noir-400 mb-4">
                      Veja nosso vídeo demonstrativo de 5 minutos.
                    </p>
                    <Button variant="secondary" className="w-full" asChild>
                      <a href="/demo-video">
                        <Play className="w-4 h-4 mr-2" />
                        Assistir vídeo
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Trust note */}
                <Card className="p-6 bg-noir-900/50 border-noir-700">
                  <CardContent className="p-0">
                    <p className="text-sm text-noir-400">
                      Mais de <span className="text-amber-500 font-semibold">500 empresas</span> já
                      viram a demonstração. Junte-se ao time dos que levam segurança a sério.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="relative py-16">
          <div className="mx-auto max-w-4xl px-4 w-full">
            <Card className="p-8 text-center bg-noir-900/50 border-noir-700">
              <h3 className="font-display text-2xl font-bold mb-4">
                Ainda deciding?
              </h3>
              <p className="text-noir-400 mb-6 max-w-prose mx-auto">
                Comece com nosso teste gratuito de 14 dias. Sem cartão de crédito.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="/register">Começar grátis</a>
                </Button>
                <Button variant="secondary" asChild>
                  <a href="/pricing">Ver planos</a>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}