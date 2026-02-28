import { Component, computed, signal, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';


type DailyPoint = { day: string; conversations: number; messages: number; p95Ms: number };
type IntentPoint = { intent: string; count: number };
type Outcomes = { resolved: number; handoff: number; failed: number };

@Component({
  selector: 'app-chatbot-cockpit',
  standalone: true,
  imports: [CommonModule, BaseChartDirective,RouterLink],
  templateUrl: './cockpit.component.html',
  styleUrls: ['./cockpit.component.css'],
})
export class CockpitComponent {
  constructor(private router: Router) {}
  
  private readonly platformId = inject(PLATFORM_ID);
   private conversations = signal(1280);
  private aiResolvedConv = signal(920);
  private handoffConv = signal(360);

  private avgAiResponseMs = signal(820);
  private avgConversationDurationSec = signal(96);

  private uniqueUsersCount = signal(740);

  private intents = signal([
    { name: 'TrackOrder', count: 420 },
    { name: 'ResetPassword', count: 310 },
    { name: 'Refund', count: 190 },
    { name: 'ShippingInfo', count: 160 },
    { name: 'HumanHandoff', count: 120 },
  ]);

  // ===== KPI COMPUTED =====
  readonly totalConversations = computed(() => this.conversations());
  readonly aiResolved = computed(() => this.aiResolvedConv());
  readonly handoff = computed(() => this.handoffConv());
  readonly avgResponseMs = computed(() => this.avgAiResponseMs());
  readonly avgConversationSec = computed(() => this.avgConversationDurationSec());
  readonly uniqueUsers = computed(() => this.uniqueUsersCount());

  // ===== CHART =====
  readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  readonly topIntentData = computed<ChartData<'bar'>>(() => ({
    labels: this.intents().map(i => i.name),
    datasets: [{
      data: this.intents().map(i => i.count),
      backgroundColor: '#2563eb',
      borderRadius: 6,
    } as any],
  }));

  // ===== UTILS =====
  num(v: number) {
    return new Intl.NumberFormat('it-IT').format(v);
  }

// private makeGradient(topRgba: string, bottomRgba: string) {
//   // In SSR non esiste canvas; in SPA va benissimo.
//   if (!isPlatformBrowser(this.platformId)) return bottomRgba;

//   const canvas = document.createElement('canvas');
//   const ctx = canvas.getContext('2d');
//   if (!ctx) return bottomRgba;

//   const g = ctx.createLinearGradient(0, 0, 0, 260);
//   g.addColorStop(0, topRgba);
//   g.addColorStop(1, bottomRgba);
//   return g;
// }


//   // ---- Fake data (sostituisci con API) ----
//   private readonly daily = signal<DailyPoint[]>([
//     { day: 'Lun', conversations: 120, messages: 980, p95Ms: 1400 },
//     { day: 'Mar', conversations: 160, messages: 1210, p95Ms: 1500 },
//     { day: 'Mer', conversations: 90, messages: 700, p95Ms: 1100 },
//     { day: 'Gio', conversations: 210, messages: 1600, p95Ms: 1700 },
//     { day: 'Ven', conversations: 190, messages: 1505, p95Ms: 1650 },
//     { day: 'Sab', conversations: 80, messages: 620, p95Ms: 1200 },
//     { day: 'Dom', conversations: 60, messages: 480, p95Ms: 1300 },
//   ]);

//   private readonly intents = signal<IntentPoint[]>([
//     { intent: 'TrackOrder', count: 310 },
//     { intent: 'ResetPassword', count: 220 },
//     { intent: 'Refund', count: 140 },
//     { intent: 'ShippingInfo', count: 120 },
//     { intent: 'HumanHandoff', count: 95 },
//   ]);

//   private readonly outcomes = signal<Outcomes>({
//     resolved: 620,
//     handoff: 180,
//     failed: 70,
//   });

//   // ---- KPI ----
//   readonly kpiConversations = computed(() => this.daily().reduce((a, x) => a + x.conversations, 0));
//   readonly kpiMessages = computed(() => this.daily().reduce((a, x) => a + x.messages, 0));
//   readonly kpiAvgMsgsPerConv = computed(() => {
//     const conv = this.kpiConversations();
//     return conv ? (this.kpiMessages() / conv) : 0;
//   });

//   readonly kpiResolvedRate = computed(() => {
//     const o = this.outcomes();
//     const total = o.resolved + o.handoff + o.failed;
//     return total ? (o.resolved / total) : 0;
//   });

//   readonly kpiHandoffRate = computed(() => {
//     const o = this.outcomes();
//     const total = o.resolved + o.handoff + o.failed;
//     return total ? (o.handoff / total) : 0;
//   });

//   readonly kpiP95Latency = computed(() => {
//     // semplice media del p95 giornaliero (puoi farlo meglio con dati grezzi)
//     const d = this.daily();
//     return d.length ? d.reduce((a, x) => a + x.p95Ms, 0) / d.length : 0;
//   });

//   readonly lineOptions: ChartOptions<'line'> = {
//   responsive: true,
//   maintainAspectRatio: false,
//   plugins: { legend: { display: true, labels: { boxWidth: 18 } } },
//   elements: { point: { radius: 3, hoverRadius: 4 } },
//   scales: {
//     x: { grid: { display: false } },
//     y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.08)' } },
//   },
// };

// readonly barOptions: ChartOptions<'bar'> = {
//   responsive: true,
//   maintainAspectRatio: false,
//   plugins: { legend: { display: false } },
//   scales: {
//     x: { grid: { display: false } },
//     y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.08)' } },
//   },
// };

// readonly doughnutOptions: ChartOptions<'doughnut'> = {
//   responsive: true,
//   maintainAspectRatio: false,
//   cutout: '62%',
//   plugins: { legend: { position: 'bottom', labels: { boxWidth: 14 } } },
// };

//   // ---- Chart data (computed) ----
//   readonly conversationsLineData = computed<ChartData<'line'>>(() => {
//   const d = this.daily();
//   const blueFill = this.makeGradient('rgba(37, 99, 235, 0.18)', 'rgba(37, 99, 235, 0.02)');
//   const greenFill = this.makeGradient('rgba(22, 163, 74, 0.18)', 'rgba(22, 163, 74, 0.02)');

//   return {
//     labels: d.map(x => x.day),
//     datasets: [
//       {
//         data: d.map(x => x.conversations),
//         label: 'Conversazioni',
//         borderColor: '#2563eb',
//         backgroundColor: blueFill,
//         fill: true,
//         tension: 0.35,
//         borderWidth: 3,
//         pointBackgroundColor: '#2563eb',
//       },
//       {
//         data: d.map(x => x.messages),
//         label: 'Messaggi',
//         borderColor: '#16a34a',
//         backgroundColor: greenFill,
//         fill: true,
//         tension: 0.35,
//         borderWidth: 3,
//         pointBackgroundColor: '#16a34a',
//       },
//     ],
//   };
// });


//   readonly p95LineData = computed<ChartData<'line'>>(() => {
//   const d = this.daily();
//   const purpleFill = this.makeGradient('rgba(124, 58, 237, 0.20)', 'rgba(124, 58, 237, 0.02)');

//   return {
//     labels: d.map(x => x.day),
//     datasets: [
//       {
//         data: d.map(x => x.p95Ms),
//         label: 'Latency p95 (ms)',
//         borderColor: '#7c3aed',
//         backgroundColor: purpleFill,
//         fill: true,
//         tension: 0.35,
//         borderWidth: 3,
//         pointBackgroundColor: '#7c3aed',
//       },
//     ],
//   };
// });

//   readonly outcomesDoughnutData = computed<ChartData<'doughnut'>>(() => {
//   const o = this.outcomes();
//   return {
//     labels: ['Risolte', 'Handoff', 'Fallite'],
//     datasets: [
//       {
//         data: [o.resolved, o.handoff, o.failed],
//         backgroundColor: ['#2563eb', '#f97316', '#dc2626'],
//         borderColor: 'rgba(255,255,255,0.9)',
//         borderWidth: 2,
//       },
//     ],
//   };
// });


//   readonly intentsBarData = computed<ChartData<'bar'>>(() => {
//   const i = this.intents();
//   return {
//     labels: i.map(x => x.intent),
//     datasets: [
//       {
//         data: i.map(x => x.count),
//         label: 'Conteggio',
//         backgroundColor: '#3b82f6',
//         borderColor: '#2563eb',
//         borderWidth: 1,
//         borderRadius: 8,
//       } as any, // Chart.js accetta borderRadius sul bar; TS a volte rompe senza cast
//     ],
//   };
// });


//   // ---- Utility ----
//   pct(v: number): string {
//     return `${Math.round(v * 100)}%`;
//   }
//   ms(v: number): string {
//     return `${Math.round(v)} ms`;
//   }
//   num(v: number): string {
//     return new Intl.NumberFormat('it-IT').format(Math.round(v));
//   }
}
