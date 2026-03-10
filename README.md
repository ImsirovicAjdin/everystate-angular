# @everystate/angular

Angular adapter for [EveryState](https://www.npmjs.com/package/@everystate/core). Four functions that bridge the reactive store to Angular's signal-based reactivity system. ~30 lines, zero dependencies beyond Angular and the core store.

```
npm install @everystate/angular @everystate/core
```

Peer dependencies: `@angular/core >=17.0.0` and `@everystate/core >=1.0.5`.

## Why an Angular Adapter?

Angular has dependency injection, services, RxJS, and signals. You might ask: does it need an adapter?

Yes. Without one, every team reinvents the bridge differently. Some try RxJS subjects. Some try Zone.js tricks. Some give up. The adapter standardizes the pattern and gives Angular the same first-class EveryState integration that React and Vue already have.

### What it eliminates

- **@Input() / @Output() drilling** - Components read from the store directly. No props, no event emitters, no forwarding.
- **BehaviorSubject + service methods** - Logic lives in subscribers, not service methods welded to Angular.
- **NgRx ceremony** - Actions, reducers, effects, selectors, feature modules. EveryState: store + subscribers + adapter.
- **State fragmentation** - No more deciding between class properties, BehaviorSubjects, NgRx, or signals. It's a dot-path. Always.

## The API

### `usePath(store, path)`

Subscribe to a dot-path. Returns a read-only Angular signal that updates when the store value changes. Only components reading this signal re-render - no Zone.js overhead.

```ts
import { usePath } from '@everystate/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `<span>{{ count() }} tasks</span>`
})
export class HeaderComponent {
  count: Signal<number>;
  constructor(private store: StoreService) {
    this.count = usePath<number>(store, 'state.taskCount');
  }
}
```

### `useIntent(store, path)`

Returns a stable function that publishes a value to a path.

```ts
import { useIntent } from '@everystate/angular';

@Component({
  selector: 'app-task-input',
  standalone: true,
  template: `
    <input [(ngModel)]="text" (keydown.enter)="addTask()" />
    <button (click)="addTask()">Add</button>
  `
})
export class TaskInputComponent {
  text = '';
  private add: (text: string) => void;
  constructor(private store: StoreService) {
    this.add = useIntent(store, 'intent.addTask');
  }
  addTask(): void {
    this.add(this.text);
    this.text = '';
  }
}
```

### `useWildcard(store, path)`

Subscribe to a wildcard path. Returns a read-only signal that updates when any child changes.

```ts
const user = useWildcard(store, 'state.user.*');
// Re-renders when state.user.name, state.user.email, etc. change
```

### `useAsync(store, path)`

Async data fetching with automatic status tracking. Auto-aborts previous in-flight requests.

```ts
const { data, status, error, execute, cancel } = useAsync(store, 'users');
execute((signal) => fetch('/api/users', { signal }).then(r => r.json()));
```

## The StoreService Pattern

The adapter provides functions, not an Angular service. You create the service:

```ts
@Injectable({ providedIn: 'root' })
export class StoreService {
  private store = createEveryState({
    state: { tasks: [], taskCount: 0, filter: 'all' },
    derived: { tasks: { filtered: [] } }
  });

  get = this.store.get.bind(this.store);
  set = this.store.set.bind(this.store);
  subscribe = this.store.subscribe.bind(this.store);
  setAsync = this.store.setAsync.bind(this.store);
  cancel = this.store.cancel.bind(this.store);

  constructor() {
    // Business logic in subscribers, not component methods
    this.store.subscribe('intent.addTask', (text: string) => {
      const t = String(text || '').trim();
      if (!t) return;
      const tasks = this.store.get('state.tasks') || [];
      const next = [...tasks, { id: Date.now().toString(36), text: t, completed: false }];
      this.store.set('state.tasks', next);
      this.store.set('state.taskCount', next.length);
    });
  }
}
```

Why separate the adapter from the service? Because the store logic is **identical** across React, Vue, and Angular. Only the bridge changes.

## Angular-Specific Advantages

### Signals are the perfect bridge

Angular 17+ signals provide fine-grained reactivity. `usePath` creates a signal and subscribes to the store. Changes propagate surgically.

- **No Zone.js overhead**: Signals bypass zone-based change detection
- **Surgical updates**: Only components consuming a specific signal re-render
- **Zoneless-ready**: Angular 19+ without Zone.js works identically

### DI is genuinely excellent

Angular's DI is arguably a stronger integration point than React's Context. The framework wants you to inject singletons, and that's exactly what the store is. `StoreService` fits naturally into `@Injectable({ providedIn: 'root' })`.

### Clean templates

Before:
```html
<app-task-list [tasks]="tasks" (toggle)="toggle($event)" (delete)="delete($event)">
```

After:
```html
<app-task-list></app-task-list>
```

### Testing without Angular

```ts
test('adding a task increments taskCount', () => {
  const service = new StoreService();
  service.set('intent.addTask', 'test task');
  expect(service.get('state.taskCount')).toBe(1);
});
```

No TestBed. No ComponentFixture. No fakeAsync. Just state in, state out.

## Comparison to NgRx

NgRx: actions + reducers + effects + selectors + feature modules. Each is a separate file, concept, and thing to name.

EveryState: intents published to subscribers. Subscribers read and write state directly. Derived state is another subscription, not a separate selector abstraction.

For teams that need strict guardrails, NgRx remains solid. For teams that want the same separation of concerns with fewer moving parts, EveryState offers a lighter path.

## Cross-Framework Story

The same store code runs unchanged across Angular, React, and Vue:

| Framework | Bridge | Read | Write |
|-----------|--------|------|-------|
| Angular | `signal()` + `subscribe()` | `usePath(store, path)` | `useIntent(store, path)` |
| React | `useSyncExternalStore()` | `usePath(path)` | `useIntent(path)` |
| Vue | `ref()` + `subscribe()` | `usePath(path)` | `useIntent(path)` |

The store code, intent handlers, and derived state are identical. Only the 3-line bridge function changes per framework.

## License

MIT (c) Ajdin Imsirovic
