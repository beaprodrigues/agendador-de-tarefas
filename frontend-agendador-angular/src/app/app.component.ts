import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KanbanAgendadorComponent } from './components/kanban-agendador/kanban-agendador.component';

@Component({
  selector: 'app-root',
  imports: [KanbanAgendadorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-kanban-agendador />`
})
export class AppComponent {}
