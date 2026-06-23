import { useEffect, useState } from 'react'
import { Trash2, Edit2, Check, X } from 'lucide-react'

export function Rules() {
  const [rules, setRules] = useState<any[]>([])
  const [newRule, setNewRule] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const fetchRules = () => {
    // @ts-ignore
    window.api.db.getRules().then(setRules).catch(console.error)
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleAdd = () => {
    if (!newRule.trim()) return
    // @ts-ignore
    window.api.db.addRule(newRule.trim(), '').then(() => {
      setNewRule('')
      fetchRules()
    })
  }

  const handleDelete = (id: number) => {
    // @ts-ignore
    window.api.db.deleteRule(id).then(fetchRules)
  }

  const startEdit = (rule: any) => {
    setEditingId(rule.id)
    setEditText(rule.title)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = (id: number) => {
    if (!editText.trim()) {
      handleDelete(id)
    } else {
      // @ts-ignore
      window.api.db.updateRule(id, editText.trim(), '').then(() => {
        setEditingId(null)
        setEditText('')
        fetchRules()
      })
    }
  }

  return (
    <div className="space-y-10 max-w-3xl">
      <header className="border-b border-border pb-6">
        <h2 className="text-4xl font-extrabold tracking-tight uppercase text-foreground/90">Constitution</h2>
        <p className="text-muted-foreground mt-2 tracking-wide">Personal axioms and rules of engagement.</p>
      </header>

      <div className="space-y-6">
        {/* Rules List */}
        {rules.length === 0 ? (
          <div className="text-muted-foreground text-center py-12 border border-dashed border-border rounded-lg bg-card/50">
            No rules established. Begin writing your constitution.
          </div>
        ) : (
          <ol className="space-y-4 counter-reset-rules">
            {rules.map((rule, index) => (
              <li 
                key={rule.id} 
                className="group flex items-start gap-4 p-5 border border-border rounded-md bg-card shadow-sm transition-all hover:border-primary/30"
              >
                <div className="text-2xl font-bold text-primary/30 select-none pt-0.5">
                  {(index + 1).toString().padStart(2, '0')}
                </div>
                
                <div className="flex-1 min-w-0">
                  {editingId === rule.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-background border border-primary/50 rounded px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(rule.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        autoFocus
                      />
                      <button onClick={() => saveEdit(rule.id)} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1.5 text-muted-foreground hover:bg-muted rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-foreground leading-relaxed text-lg pt-1">
                      {rule.title}
                    </div>
                  )}
                </div>

                {editingId !== rule.id && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pt-1">
                    <button 
                      onClick={() => startEdit(rule)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(rule.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}

        {/* Add New Rule */}
        <div className="pt-8 mt-8 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Ratify a new rule</h3>
          <div className="flex gap-3">
            <input 
              type="text" 
              className="flex-1 bg-card border border-border rounded-md px-5 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 text-lg"
              placeholder="e.g., No phone usage during the primary 2-hour focus block."
              value={newRule}
              onChange={e => setNewRule(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button 
              onClick={handleAdd}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold tracking-wider uppercase text-sm rounded-md hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
