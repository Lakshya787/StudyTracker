import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Archive, Trash2, GripVertical, BookOpen, Plus, Clock, ArchiveX } from 'lucide-react'

const TAGS = ['General', 'Math', 'DSA', 'Physics', 'Reading', 'Coding', 'Writing', 'Other']

const TAG_COLORS: Record<string, string> = {
  General:  'bg-muted text-muted-foreground border-border',
  Math:     'bg-blue-200 text-blue-900 border-blue-900',
  DSA:      'bg-violet-200 text-violet-900 border-violet-900',
  Physics:  'bg-amber-200 text-amber-900 border-amber-900',
  Reading:  'bg-green-200 text-green-900 border-green-900',
  Coding:   'bg-cyan-200 text-cyan-900 border-cyan-900',
  Writing:  'bg-pink-200 text-pink-900 border-pink-900',
  Other:    'bg-orange-200 text-orange-900 border-orange-900',
}

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-muted text-muted-foreground border-border'
}

function formatStudied(seconds: number) {
  if (!seconds) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m studied` : `${m}m studied`
}

// ─── Sortable Todo Row ──────────────────────────────────────────────────────

function SortableTodoItem({
  todo, onToggle, onArchive, onDelete, onLogTime, onTagChange
}: {
  todo: any
  onToggle: (t: any) => void
  onArchive: (id: number) => void
  onDelete: (id: number) => void
  onLogTime: (id: number) => void
  onTagChange: (id: number, tag: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  const [showTagPicker, setShowTagPicker] = useState(false)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-4 p-4 border-2 rounded-xl bg-card transition-all duration-300
        ${todo.done === 1 ? 'opacity-60 border-foreground shadow-[2px_2px_0px_var(--color-foreground)] bg-muted' : 'border-foreground shadow-pop hover:-translate-y-1 hover:shadow-pop-hover'}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 text-foreground hover:text-primary cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        tabIndex={-1}
      >
        <GripVertical className="w-5 h-5 stroke-[2.5px]" />
      </button>

      {/* Checkbox */}
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={todo.done === 1}
          onChange={() => onToggle(todo)}
          className="peer appearance-none w-6 h-6 border-2 border-foreground rounded bg-background checked:bg-primary cursor-pointer transition-colors shadow-[2px_2px_0px_var(--color-foreground)]"
        />
        <svg className="absolute w-4 h-4 text-primary-foreground pointer-events-none top-1 left-1 opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-base font-bold leading-relaxed ${todo.done === 1 ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {todo.title}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Tag badge */}
          <div className="relative">
            <button
              onClick={() => setShowTagPicker(p => !p)}
              className={`text-xs px-3 py-1 rounded-full font-extrabold tracking-widest uppercase border-2 transition-all hover:shadow-[2px_2px_0px_var(--color-foreground)] ${tagColor(todo.tag ?? 'General')}`}
            >
              {todo.tag ?? 'General'}
            </button>
            {showTagPicker && (
              <div className="absolute left-0 top-8 z-20 bg-card border-2 border-foreground rounded-xl shadow-pop p-3 flex flex-wrap gap-2 w-56">
                {TAGS.map(t => (
                  <button
                    key={t}
                    onClick={() => { onTagChange(todo.id, t); setShowTagPicker(false) }}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border-2 transition-all hover:shadow-[2px_2px_0px_var(--color-foreground)] ${tagColor(t)} ${todo.tag === t ? 'shadow-[2px_2px_0px_var(--color-foreground)]' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Studied time badge */}
          {todo.studied_seconds > 0 && (
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 bg-background px-2 py-1 rounded-md border-2 border-border">
              <Clock className="w-3 h-3 stroke-[3px]" />
              {formatStudied(todo.studied_seconds)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
        <button
          onClick={() => onLogTime(todo.id)}
          title="Log study time"
          className="p-2 border-2 border-transparent hover:border-foreground bg-background hover:bg-tertiary hover:shadow-[2px_2px_0px_var(--color-foreground)] text-foreground rounded-full transition-all"
        >
          <Clock className="w-4 h-4 stroke-[2.5px]" />
        </button>
        <button
          onClick={() => onArchive(todo.id)}
          title="Archive"
          className="p-2 border-2 border-transparent hover:border-foreground bg-background hover:bg-amber-400 hover:shadow-[2px_2px_0px_var(--color-foreground)] text-foreground rounded-full transition-all"
        >
          <Archive className="w-4 h-4 stroke-[2.5px]" />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          title="Delete permanently"
          className="p-2 border-2 border-transparent hover:border-foreground bg-background hover:bg-destructive hover:text-destructive-foreground hover:shadow-[2px_2px_0px_var(--color-foreground)] text-foreground rounded-full transition-all"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </div>
    </li>
  )
}

// ─── Log Time Modal ─────────────────────────────────────────────────────────

function LogTimeModal({ todoTitle, onConfirm, onClose }: {
  todoTitle: string
  onConfirm: (minutes: number) => void
  onClose: () => void
}) {
  const [minutes, setMinutes] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
      <div className="bg-card border-4 border-foreground rounded-2xl p-8 w-96 shadow-pop">
        <h3 className="font-heading font-extrabold text-2xl text-foreground mb-2">Log Study Time</h3>
        <p className="text-sm font-bold text-muted-foreground mb-6 truncate">{todoTitle}</p>
        <div className="flex items-center gap-4 mb-6">
          <input
            type="number"
            min={1}
            max={480}
            autoFocus
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && minutes && onConfirm(Number(minutes))}
            className="flex-1 bg-background border-2 border-foreground rounded-xl px-4 py-3 text-foreground focus:outline-none focus:shadow-pop text-center text-4xl font-heading font-extrabold transition-shadow"
            placeholder="25"
          />
          <span className="text-foreground font-bold text-lg uppercase tracking-widest">mins</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold uppercase tracking-widest text-foreground bg-background border-2 border-foreground rounded-xl hover:shadow-[2px_2px_0px_var(--color-foreground)] transition-all">Cancel</button>
          <button
            onClick={() => minutes && onConfirm(Number(minutes))}
            disabled={!minutes || Number(minutes) < 1}
            className="flex-1 py-3 text-sm font-bold uppercase tracking-widest bg-primary text-primary-foreground border-2 border-foreground rounded-xl hover:shadow-[2px_2px_0px_var(--color-foreground)] transition-all disabled:opacity-40 disabled:hover:shadow-none"
          >
            Log
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Todo Component ────────────────────────────────────────────────────

export function Todo() {
  const [todos, setTodos] = useState<any[]>([])
  const [archivedTodos, setArchivedTodos] = useState<any[]>([])
  const [newTask, setNewTask] = useState('')
  const [newTag, setNewTag] = useState('General')
  const [filter, setFilter] = useState<'All' | 'Active' | 'Done'>('All')
  const [groupByTag, setGroupByTag] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [logTimeFor, setLogTimeFor] = useState<any | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const fetchTodos = useCallback(async () => {
    // @ts-ignore
    const active = await window.api.db.getTodos()
    setTodos(active)
    // @ts-ignore
    const archived = await window.api.db.getArchivedTodos()
    setArchivedTodos(archived)
  }, [])

  useEffect(() => { fetchTodos() }, [fetchTodos])

  const handleAdd = async () => {
    if (!newTask.trim()) return
    // @ts-ignore
    await window.api.db.addTodo(newTask.trim(), newTag)
    setNewTask('')
    fetchTodos()
  }

  const handleToggle = async (todo: any) => {
    // @ts-ignore
    await window.api.db.updateTodo(todo.id, todo.done === 1 ? 0 : 1)
    fetchTodos()
  }

  const handleArchive = async (id: number) => {
    // @ts-ignore
    await window.api.db.archiveTodo(id)
    fetchTodos()
  }

  const handleDelete = async (id: number) => {
    // @ts-ignore
    await window.api.db.deleteTodo(id)
    fetchTodos()
  }

  const handleTagChange = async (id: number, tag: string) => {
    // @ts-ignore
    await window.api.db.updateTodoTag(id, tag)
    fetchTodos()
  }

  const handleLogTime = async (minutes: number) => {
    if (!logTimeFor) return
    const seconds = minutes * 60
    // @ts-ignore
    await window.api.db.addStudiedSeconds(logTimeFor.id, seconds)
    setLogTimeFor(null)
    fetchTodos()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = filtered.findIndex(t => t.id === active.id)
    const newIndex = filtered.findIndex(t => t.id === over.id)
    const reordered = arrayMove(filtered, oldIndex, newIndex)
    setTodos(prev => {
      // Splice reordered back in place (keeping non-visible todos intact)
      const ids = new Set(filtered.map(t => t.id))
      const rest = prev.filter(t => !ids.has(t.id))
      return [...reordered, ...rest]
    })
    // @ts-ignore
    await window.api.db.updateTodoOrder(reordered.map(t => t.id))
  }

  const filtered = useMemo(() => {
    let list = todos
    if (filter === 'Active') list = todos.filter(t => t.done === 0)
    if (filter === 'Done') list = todos.filter(t => t.done === 1)
    return list
  }, [todos, filter])

  const grouped = useMemo(() => {
    if (!groupByTag) return null
    const map = new Map<string, any[]>()
    filtered.forEach(t => {
      const tag = t.tag ?? 'General'
      if (!map.has(tag)) map.set(tag, [])
      map.get(tag)!.push(t)
    })
    return map
  }, [filtered, groupByTag])

  const activeCount = todos.filter(t => t.done === 0).length
  const doneCount = todos.filter(t => t.done === 1).length

  return (
    <div className="max-w-3xl space-y-8 relative">

      {/* Header */}
      <header className="flex items-end justify-between border-b-4 border-foreground pb-6">
        <div>
          <h2 className="text-5xl font-extrabold tracking-tight text-foreground relative z-10">
            Task Queue
          </h2>
          <p className="text-muted-foreground mt-4 text-lg font-medium tracking-wide">
            <span className="text-primary font-extrabold px-2 py-0.5 rounded-md bg-primary/10 border-2 border-primary mr-1">{activeCount}</span> active ·{' '}
            <span className="text-foreground font-extrabold px-2 py-0.5 rounded-md bg-muted border-2 border-border">{doneCount}</span> done
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Group toggle */}
          <button
            onClick={() => setGroupByTag(p => !p)}
            title="Group by tag"
            className={`p-3 rounded-xl border-2 font-bold transition-all hover:-translate-y-0.5 ${groupByTag ? 'border-foreground bg-tertiary text-foreground shadow-pop-sm' : 'border-foreground bg-background text-foreground hover:shadow-pop-sm'}`}
          >
            <BookOpen className="w-5 h-5 stroke-[2.5px]" />
          </button>
          {/* Archive toggle */}
          <button
            onClick={() => setShowArchive(p => !p)}
            title="View archive"
            className={`p-3 rounded-xl border-2 font-bold transition-all hover:-translate-y-0.5 ${showArchive ? 'border-foreground bg-secondary text-secondary-foreground shadow-pop-sm' : 'border-foreground bg-background text-foreground hover:shadow-pop-sm'}`}
          >
            <ArchiveX className="w-5 h-5 stroke-[2.5px]" />
          </button>
          {/* Filter */}
          <div className="flex bg-background border-2 border-foreground rounded-xl overflow-hidden p-1 shadow-pop-sm">
            {(['All', 'Active', 'Done'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-extrabold uppercase tracking-wider rounded-lg transition-all ${filter === f ? 'bg-primary text-primary-foreground shadow-[inset_0px_0px_0px_2px_#1E293B]' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Archive view */}
      {showArchive && (
        <div className="bg-card border-4 border-foreground rounded-2xl p-6 space-y-3 shadow-pop">
          <h3 className="text-lg font-extrabold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5 stroke-[2.5px] text-secondary" /> Archive ({archivedTodos.length})
          </h3>
          {archivedTodos.length === 0 && (
            <p className="text-sm font-bold text-muted-foreground text-center py-6 border-2 border-dashed border-border rounded-xl">No archived todos yet.</p>
          )}
          {archivedTodos.map(t => (
            <div key={t.id} className="flex items-center gap-4 p-3 bg-background rounded-xl border-2 border-foreground shadow-[2px_2px_0px_var(--color-border)] opacity-70 grayscale">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border-2 flex-shrink-0 ${tagColor(t.tag ?? 'General')}`}>{t.tag ?? 'General'}</span>
              <span className={`text-sm font-bold flex-1 ${t.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</span>
              {t.studied_seconds > 0 && (
                <span className="text-xs font-bold text-muted-foreground flex-shrink-0 bg-muted px-2 py-1 rounded-md border-2 border-border">{formatStudied(t.studied_seconds)}</span>
              )}
              <button onClick={() => handleDelete(t.id)} className="p-2 border-2 border-transparent hover:border-foreground rounded-full hover:bg-destructive hover:text-destructive-foreground transition-all flex-shrink-0">
                <Trash2 className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new task */}
      <div className="bg-card border-4 border-foreground rounded-2xl p-6 space-y-4 shadow-pop relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary rounded-full opacity-10 translate-x-10 translate-y-10" />
        <div className="flex gap-3 relative z-10">
          <input
            type="text"
            className="flex-1 bg-background border-2 border-foreground rounded-xl px-5 py-3 text-lg font-bold text-foreground focus:outline-none focus:shadow-pop transition-shadow placeholder:text-muted-foreground/50 placeholder:font-medium"
            placeholder="What needs to be done? (Enter to add)"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} className="px-6 py-3 bg-tertiary text-foreground font-extrabold uppercase tracking-widest border-2 border-foreground rounded-xl hover:-translate-y-1 hover:shadow-pop-sm active:translate-y-0 active:shadow-none transition-all flex items-center justify-center">
            <Plus className="w-6 h-6 stroke-[3px]" />
          </button>
        </div>
        {/* Tag selector for new task */}
        <div className="flex flex-wrap gap-2 relative z-10 mt-2">
          {TAGS.map(t => (
            <button
              key={t}
              onClick={() => setNewTag(t)}
              className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border-2 transition-all hover:shadow-[2px_2px_0px_var(--color-foreground)] hover:-translate-y-0.5 ${
                newTag === t ? `${tagColor(t)} shadow-[2px_2px_0px_var(--color-foreground)] border-foreground` : 'border-border text-muted-foreground hover:border-foreground bg-background'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="bg-card border-4 border-foreground rounded-2xl p-6 shadow-pop">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-bold uppercase tracking-widest text-sm border-2 border-dashed border-foreground/30 rounded-xl bg-background/50">
            {filter === 'All' ? "Clean slate. Add something above." : `No ${filter.toLowerCase()} tasks.`}
          </div>
        ) : grouped ? (
          // ── Grouped by tag view ──
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([tag, items]) => (
              <div key={tag}>
                <div className="flex items-center gap-3 mb-4 border-b-2 border-border pb-2">
                  <span className={`text-sm px-3 py-1 rounded-full font-extrabold uppercase tracking-widest border-2 border-foreground shadow-[2px_2px_0px_var(--color-foreground)] ${tagColor(tag)}`}>{tag}</span>
                  <span className="text-sm font-bold text-muted-foreground">{items.length} task{items.length !== 1 ? 's' : ''}</span>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-1.5">
                      {items.map(todo => (
                        <SortableTodoItem
                          key={todo.id}
                          todo={todo}
                          onToggle={handleToggle}
                          onArchive={handleArchive}
                          onDelete={handleDelete}
                          onLogTime={t => setLogTimeFor(todos.find(x => x.id === t) ?? null)}
                          onTagChange={handleTagChange}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
            ))}
          </div>
        ) : (
          // ── Flat sortable list ──
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1.5">
                {filtered.map(todo => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onLogTime={t => setLogTimeFor(todos.find(x => x.id === t) ?? null)}
                    onTagChange={handleTagChange}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Log time modal */}
      {logTimeFor && (
        <LogTimeModal
          todoTitle={logTimeFor.title}
          onConfirm={handleLogTime}
          onClose={() => setLogTimeFor(null)}
        />
      )}
    </div>
  )
}
