import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartKpiComponent } from './chart-kpi.component';

describe('ChartKpiComponent', () => {
  let component: ChartKpiComponent;
  let fixture: ComponentFixture<ChartKpiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartKpiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartKpiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
