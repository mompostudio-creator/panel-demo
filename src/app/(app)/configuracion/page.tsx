"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, SectionTitle, inputClass, RowInput } from "@/components/ui";

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${on ? "bg-good" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function ConfiguracionPage() {
  const [horarios, setHorarios] = useState([
    { day: "Lunes", hours: "09:00 – 14:00, 16:00 – 20:00" },
    { day: "Martes", hours: "09:00 – 14:00, 16:00 – 20:00" },
    { day: "Miércoles", hours: "09:00 – 14:00, 16:00 – 20:00" },
    { day: "Jueves", hours: "09:00 – 14:00, 16:00 – 20:00" },
    { day: "Viernes", hours: "09:00 – 15:00" },
    { day: "Sábado", hours: "10:00 – 13:00" },
    { day: "Domingo", hours: "Cerrado" },
  ]);

  const [servicios, setServicios] = useState([
    { name: "Sesión de mantenimiento", duration: "30 min", price: "45€" },
    { name: "Revisión general", duration: "20 min", price: "30€" },
    { name: "Primera visita", duration: "45 min", price: "0€" },
    { name: "Programa premium", duration: "60 min", price: "180€" },
    { name: "Ajuste de plan", duration: "30 min", price: "60€" },
  ]);

  const [duracionCita, setDuracionCita] = useState("30 min");

  const [festivos, setFestivos] = useState([
    { date: "15 ago 2026", label: "Asunción de la Virgen" },
    { date: "12 oct 2026", label: "Fiesta Nacional" },
    { date: "25 dic 2026", label: "Navidad" },
  ]);

  const [usuarios, setUsuarios] = useState([
    { name: "Isabel Ferrer", role: "Administradora" },
    { name: "Marcos Vidal", role: "Recepción" },
    { name: "Pau Camps", role: "Especialista" },
  ]);

  const [integraciones, setIntegraciones] = useState([
    { name: "Google Calendar", connected: true },
    { name: "WhatsApp Business", connected: true },
    { name: "Instagram", connected: true },
    { name: "Formulario web", connected: true },
  ]);

  const [idioma, setIdioma] = useState("Español");
  const [zonaHoraria, setZonaHoraria] = useState("Europe/Madrid");
  const [notificaciones, setNotificaciones] = useState(true);

  return (
    <div className="max-w-4xl space-y-6">
      <SectionTitle title="Configuración" subtitle="Ajustes generales de tu negocio" />

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Horarios</h2>
        <div className="space-y-1">
          {horarios.map((h, i) => (
            <div key={h.day} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
              <span className="text-ink-secondary">{h.day}</span>
              <RowInput
                value={h.hours}
                onChange={(v) => setHorarios((prev) => prev.map((x, xi) => (xi === i ? { ...x, hours: v } : x)))}
                className="text-right font-medium w-64"
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Servicios</h2>
          <div className="space-y-1">
            {servicios.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-border last:border-0">
                <RowInput
                  value={s.name}
                  onChange={(v) => setServicios((prev) => prev.map((x, xi) => (xi === i ? { ...x, name: v } : x)))}
                  className="flex-1 font-medium min-w-0"
                />
                <RowInput
                  value={s.duration}
                  onChange={(v) => setServicios((prev) => prev.map((x, xi) => (xi === i ? { ...x, duration: v } : x)))}
                  className="w-16 text-xs text-ink-muted"
                />
                <RowInput
                  value={s.price}
                  onChange={(v) => setServicios((prev) => prev.map((x, xi) => (xi === i ? { ...x, price: v } : x)))}
                  className="w-16 tabular text-right"
                />
                <button
                  onClick={() => setServicios((prev) => prev.filter((_, xi) => xi !== i))}
                  className="text-ink-muted hover:text-critical shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setServicios((prev) => [...prev, { name: "Nuevo servicio", duration: "30 min", price: "0€" }])}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent mt-3 hover:underline"
          >
            <Plus size={13} />
            Añadir servicio
          </button>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Duración de citas</h2>
          <p className="text-sm text-ink-secondary mb-4">Duración por defecto asignada a una cita nueva sin servicio específico.</p>
          <input
            value={duracionCita}
            onChange={(e) => setDuracionCita(e.target.value)}
            className="text-3xl font-semibold tabular w-full border-none focus:outline-none bg-transparent"
          />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Festivos</h2>
          <div className="space-y-1">
            {festivos.map((f, i) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-border last:border-0">
                <RowInput
                  value={f.label}
                  onChange={(v) => setFestivos((prev) => prev.map((x, xi) => (xi === i ? { ...x, label: v } : x)))}
                  className="flex-1 min-w-0"
                />
                <RowInput
                  value={f.date}
                  onChange={(v) => setFestivos((prev) => prev.map((x, xi) => (xi === i ? { ...x, date: v } : x)))}
                  className="w-28 tabular text-right"
                />
                <button
                  onClick={() => setFestivos((prev) => prev.filter((_, xi) => xi !== i))}
                  className="text-ink-muted hover:text-critical shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setFestivos((prev) => [...prev, { date: "1 ene 2027", label: "Nuevo festivo" }])}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent mt-3 hover:underline"
          >
            <Plus size={13} />
            Añadir festivo
          </button>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Usuarios</h2>
          <div className="space-y-1">
            {usuarios.map((u, i) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-border last:border-0">
                <RowInput
                  value={u.name}
                  onChange={(v) => setUsuarios((prev) => prev.map((x, xi) => (xi === i ? { ...x, name: v } : x)))}
                  className="flex-1 font-medium min-w-0"
                />
                <RowInput
                  value={u.role}
                  onChange={(v) => setUsuarios((prev) => prev.map((x, xi) => (xi === i ? { ...x, role: v } : x)))}
                  className="w-28 text-ink-muted text-right"
                />
                <button
                  onClick={() => setUsuarios((prev) => prev.filter((_, xi) => xi !== i))}
                  className="text-ink-muted hover:text-critical shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setUsuarios((prev) => [...prev, { name: "Nuevo usuario", role: "Recepción" }])}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent mt-3 hover:underline"
          >
            <Plus size={13} />
            Añadir usuario
          </button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Integraciones</h2>
          <div className="space-y-2">
            {integraciones.map((i, idx) => (
              <div key={i.name} className="flex justify-between items-center text-sm py-1.5 border-b border-border last:border-0">
                <span className="font-medium">{i.name}</span>
                <Switch
                  on={i.connected}
                  onToggle={() =>
                    setIntegraciones((prev) => prev.map((x, xi) => (xi === idx ? { ...x, connected: !x.connected } : x)))
                  }
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Preferencias</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-ink-secondary">Idioma</span>
              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                className={`${inputClass} w-32 py-1.5`}
              >
                <option>Español</option>
                <option>English</option>
                <option>Català</option>
              </select>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-ink-secondary">Zona horaria</span>
              <select
                value={zonaHoraria}
                onChange={(e) => setZonaHoraria(e.target.value)}
                className={`${inputClass} w-40 py-1.5`}
              >
                <option>Europe/Madrid</option>
                <option>Europe/Lisbon</option>
                <option>Atlantic/Canary</option>
              </select>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-ink-secondary">Notificaciones</span>
              <Switch on={notificaciones} onToggle={() => setNotificaciones((v) => !v)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
