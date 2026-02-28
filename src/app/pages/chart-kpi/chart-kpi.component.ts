import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';



type ConvTs = { t: string; total: number; aiResolved: number };
type ChannelRow = {
  channel: 'whatsapp' | 'facebook' | 'telegram' | 'instagram' | 'chat';
  conversations: number;
  aiResolved: number;
  handoff: number;
  failed: number;
};
type Billing = {
  plan: 'FREE' | 'PRO';
  included: number;
  used: number;
  estimatedCost: number;
};

@Component({
  selector: 'app-chart-kpi',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './chart-kpi.component.html',
  styleUrl: './chart-kpi.component.css'
})
export class ChartKpiComponent {
 private platformId = inject(PLATFORM_ID);

  // =====================
  // MOCK DATA
  // =====================
  readonly convTs = signal<ConvTs[]>([
    { t: '01-01', total: 120, aiResolved: 82 },
    { t: '01-02', total: 150, aiResolved: 96 },
    { t: '01-03', total: 180, aiResolved: 121 },
    { t: '01-04', total: 210, aiResolved: 155 },
    { t: '01-05', total: 170, aiResolved: 112 },
    { t: '01-06', total: 130, aiResolved: 90 },
    { t: '01-07', total: 160, aiResolved: 118 },
  ]);

  readonly channels = signal<ChannelRow[]>([
    { channel: 'whatsapp', conversations: 420, aiResolved: 290, handoff: 90, failed: 40 },
    { channel: 'facebook', conversations: 260, aiResolved: 150, handoff: 70, failed: 40 },
    { channel: 'telegram', conversations: 180, aiResolved: 120, handoff: 40, failed: 20 },
    { channel: 'instagram', conversations: 200, aiResolved: 40, handoff: 30, failed: 20 },
    { channel: 'chat', conversations: 100, aiResolved: 70, handoff: 10, failed: 20 },
  ]);

  readonly billing = signal<Billing>({
    plan: 'PRO',
    included: 1000,
    used: 860,
    estimatedCost: 42.8,
  });

  readonly billingCost = signal([
    { t: '01-01', cost: 4.1 },
    { t: '01-02', cost: 5.3 },
    { t: '01-03', cost: 6.8 },
    { t: '01-04', cost: 8.2 },
    { t: '01-05', cost: 7.1 },
    { t: '01-06', cost: 5.6 },
    { t: '01-07', cost: 6.4 },
  ]);

  // =====================
  // KPI
  // =====================
  readonly totalConv = computed(() => this.convTs().reduce((a, x) => a + x.total, 0));
  readonly totalResolved = computed(() => this.convTs().reduce((a, x) => a + x.aiResolved, 0));
  readonly resolvedRate = computed(() =>
    this.totalConv() ? this.totalResolved() / this.totalConv() : 0
  );

  // =====================
  // OPTIONS
  // =====================
  readonly lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: { legend: { position: 'bottom' } },
  };

  readonly stackedOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
  };

  // =====================
  // CHARTS
  // =====================
  readonly convTsData = computed<ChartData<'line'>>(() => {
    const d = this.convTs();
    return {
      labels: d.map(x => x.t),
      datasets: [
        {
          label: 'Conversazioni',
          data: d.map(x => x.total),
          borderColor: '#2563eb',
          backgroundColor: this.gradient('rgba(37,99,235,.25)'),
          fill: true,
          tension: 0.35,
        },
        {
          label: 'Risolte da AI',
          data: d.map(x => x.aiResolved),
          borderColor: '#16a34a',
          backgroundColor: this.gradient('rgba(22,163,74,.25)'),
          fill: true,
          tension: 0.35,
        },
      ],
    };
  });

  readonly channelsShareData = computed<ChartData<'doughnut'>>(() => {
    const c = this.channels();
    return {
      labels: c.map(x => x.channel),
      datasets: [{
        data: c.map(x => x.conversations),
        backgroundColor: ['#2563eb', '#f97316', '#7c3aed' ,'#917c08','#0bb34b'],
      }],
    };
  });

  readonly channelsStackedData = computed<ChartData<'bar'>>(() => {
    const c = this.channels();
    return {
      labels: c.map(x => x.channel),
      datasets: [
        { label: 'AI', data: c.map(x => x.aiResolved), backgroundColor: '#16a34a' },
        { label: 'Handoff', data: c.map(x => x.handoff), backgroundColor: '#f97316' },
        { label: 'Failed', data: c.map(x => x.failed), backgroundColor: '#dc2626' },
      ],
    };
  });

  readonly billingCostData = computed<ChartData<'line'>>(() => {
    const d = this.billingCost();
    return {
      labels: d.map(x => x.t),
      datasets: [{
        label: 'Costo €',
        data: d.map(x => x.cost),
        borderColor: '#7c3aed',
        backgroundColor: this.gradient('rgba(124,58,237,.25)'),
        fill: true,
        tension: 0.35,
      }],
    };
  });

  // =====================
  // HELPERS
  // =====================
  private gradient(color: string) {
    if (!isPlatformBrowser(this.platformId)) return color;
    const c = document.createElement('canvas').getContext('2d')!;
    const g = c.createLinearGradient(0, 0, 0, 260);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    return g;
  }

  pct(v: number) { return `${Math.round(v * 100)}%`; }
}
