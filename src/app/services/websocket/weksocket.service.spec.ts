import { TestBed } from '@angular/core/testing';

import { WeksocketService } from './weksocket.service';

describe('WeksocketService', () => {
  let service: WeksocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeksocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
