import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleLugar } from './detalle-lugar';

describe('DetalleLugar', () => {
  let component: DetalleLugar;
  let fixture: ComponentFixture<DetalleLugar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleLugar],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleLugar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
