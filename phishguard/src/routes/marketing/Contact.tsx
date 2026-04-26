/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";

// Hook for scroll-triggered animations
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const currentRef = ref.current;
    if (currentRef) {
      const revealElements = currentRef.querySelectorAll(".reveal, .stagger-children");
      revealElements.forEach((el) => observer.observe(el));
    }

    return () => {
      if (currentRef) {
        const revealElements = currentRef.querySelectorAll(".reveal, .stagger-children");
        revealElements.forEach((el) => observer.unobserve(el));
      }
    };
  }, []);

  return ref;
}

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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-fg-primary">
        {label} {required && <span className="text-amber-500">*</span>}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

// Contact info card
function ContactInfoCard({
  icon: Icon,
  title,
  content,
}: {
  icon: typeof Mail;
  title: string;
  content: string;
}) {
  return (
    <div className="flex items-start gap-4 p-6 rounded-xl bg-noir-900/50 border border-noir-800 hover:border-amber-500/30 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-amber-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-fg-primary mb-1">{title}</h3>
        <p className="text-noir-400">{content}</p>
      </div>
    </div>
  );
}

// Main ContactPage component
export default function ContactPage() {
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
            <CheckCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4 text-fg-primary">
            Mensagem enviada!
          </h1>
          <p className="text-xl text-noir-400 max-w-md mx-auto mb-8">
            Nossa equipe entrará em contato em até 4 horas úteis durante horário comercial.
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

      <div className="relative" ref={useScrollReveal()}>
        {/* Hero section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />

          <div className="relative mx-auto max-w-4xl px-4 text-center w-full reveal">
            <span className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Fale conosco
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Fale com nossa{' '}
              <span className="text-amber-500">equipe de vendas</span>
            </h1>
            <p className="text-xl text-noir-300 max-w-4xl mx-auto">
              Nossa equipe está pronta para ajudar você a encontrar a melhor solução
              para as necessidades da sua organização.
            </p>
          </div>
        </section>

        {/* Contact section */}
        <section className="relative py-16">
          <div className="mx-auto max-w-6xl px-4 w-full">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact form */}
              <div className="lg:col-span-2">
                <Card className="p-8 bg-noir-900/50 border-noir-700">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl">Envie uma mensagem</CardTitle>
                    <CardDescription className="mt-2">
                      Preencha o formulário abaixo e nossa equipe responderá em breve.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField label="Nome completo" placeholder="Seu nome" required />
                        <FormField label="Email" type="email" placeholder="seu@empresa.com" required />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField label="Empresa" placeholder="Nome da empresa" required />
                        <FormField label="Telefone" type="tel" placeholder="(11) 99999-9999" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-fg-primary">
                          Plano de interesse <span className="text-amber-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 rounded-lg bg-noir-900 border border-noir-700 text-fg-primary focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                        >
                          <option value="">Selecione um plano</option>
                          <option value="starter">Starter - R$ 29/mês</option>
                          <option value="business">Business - R$ 99/mês</option>
                          <option value="enterprise">Enterprise - Sob consulta</option>
                          <option value="whitelabel">White Label - Sob consulta</option>
                          <option value="unaware">Ainda não sei</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-fg-primary">
                          Número de funcionários <span className="text-amber-500">*</span>
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
                          Mensagem <span className="text-amber-500">*</span>
                        </label>
                        <Textarea
                          placeholder="Conte-nos sobre suas necessidades..."
                          required
                          rows={4}
                        />
                      </div>
                      <Button type="submit" size="lg" className="w-full" disabled={loading}>
                        {loading ? (
                          "Enviando..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar mensagem
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact info */}
              <div className="space-y-6 stagger-children">
                <ContactInfoCard
                  icon={Mail}
                  title="Email"
                  content="vendas@phishguard.com.br"
                />
                <ContactInfoCard
                  icon={Phone}
                  title="Telefone"
                  content="+55 61 4042 8900"
                />
                <ContactInfoCard
                  icon={Clock}
                  title="Horário comercial"
                  content="Seg a Sex: 9h às 18h (Brasília)"
                />
                <ContactInfoCard
                  icon={MapPin}
                  title="Escritório"
                  content="Brasília - DF, Brasil"
                />

                {/* Quick response note */}
                <Card className="p-6 bg-amber-500/10 border-amber-500/30">
                  <CardContent className="p-0">
                    <p className="text-sm text-fg-primary">
                      <span className="text-amber-500 font-semibold">Resposta rápida:</span>{" "}
                      Nossa equipe responde em até 4 horas durante horário comercial.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ mini section */}
        <section className="relative py-16">
          <div className="mx-auto max-w-4xl px-4 w-full">
            <Card className="p-8 text-center bg-noir-900/50 border-noir-700">
              <h3 className="font-display text-2xl font-bold mb-4">
                Prefere explorar sozinho?
              </h3>
              <p className="text-noir-400 mb-6 max-w-4xl mx-auto">
                Veja todos os planos e funcionalidades disponíveis senza falar com ninguém.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href="/pricing">Ver planos</a>
                </Button>
                <Button variant="secondary" asChild>
                  <a href="/demo">Ver demonstração</a>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}