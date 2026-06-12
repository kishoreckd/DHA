import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, FileBarChart, LockKeyhole, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input, Textarea } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { useStore } from "../store";
import { createBaselineModules, type BaselineModule, type BaselineRow, type BaselineStatus } from "../features/baseline/baseline-data";

const storageKey = "signalops-editable-baseline";
const loadModules = () => {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) as BaselineModule[] : createBaselineModules();
  } catch {
    return createBaselineModules();
  }
};

export default function BaselinePage() {
  const { state, lockBaseline } = useStore();
  const [modules, setModules] = useState(loadModules);
  const [selectedId, setSelectedId] = useState(modules[0].id);
  const [query, setQuery] = useState("");
  const selected = modules.find((module) => module.id === selectedId) ?? modules[0];

  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(modules)), [modules]);

  const updateModule = (patch: Partial<BaselineModule>) => setModules((current) => current.map((module) => module.id === selected.id ? { ...module, ...patch } : module));
  const updateRow = (rowId: string, patch: Partial<BaselineRow>) => updateModule({ rows: selected.rows.map((row) => row.id === rowId ? { ...row, ...patch } : row) });
  const addRow = () => updateModule({ rows: [...selected.rows, { id: crypto.randomUUID(), metric: "New metric", evidence: "", impact: "", gap: "", status: "review" }] });
  const deleteRow = (rowId: string) => updateModule({ rows: selected.rows.filter((row) => row.id !== rowId) });
  const groups = useMemo(() => [...new Set(modules.map((module) => module.group))], [modules]);
  const filtered = (group: string) => modules.filter((module) => module.group === group && module.name.toLowerCase().includes(query.toLowerCase()));
  const readyCount = modules.filter((module) => module.status === "ready").length;
  const averageScore = Math.round(modules.reduce((total, module) => total + module.score, 0) / modules.length);

  return <>
    <div className="stage-nav"><Link to="/app/run"><ArrowLeft size={16} />Command center</Link><Link to="/app/run/tools">Tools</Link><Link to="/app/run/baseline">Baseline</Link><Link to="/app/run/snapshots">Snapshots</Link><Link to="/app/run/assessment">Assessment</Link><Link to="/app/run/preview">Preview</Link><Link to="/app/run/review">Review</Link></div>
    <div className="page-head"><div><span className="eyebrow">EDITABLE BASELINE DASHBOARD</span><h1>{state.workspaceName} baseline workbook</h1><p>All 40 baseline modules remain on the left. Select any module and edit every score, status, metric, evidence item, impact, and validation gap.</p></div><div className="head-actions"><span className="save-state"><CheckCircle2 size={15} />Saved locally</span><Dialog><DialogTrigger asChild><Button disabled={state.baselineLocked}><LockKeyhole size={16} />{state.baselineLocked ? "Baseline locked" : "Lock baseline"}</Button></DialogTrigger><DialogContent><DialogTitle>Lock editable baseline?</DialogTitle><p>This confirms all 40 editable modules as the source for assessment generation.</p><div className="dialog-actions"><Button onClick={lockBaseline}>Confirm and lock</Button></div></DialogContent></Dialog></div></div>
    <div className="stats-grid"><Card className="stat-card"><div className="stat-icon"><FileBarChart /></div><span>Baseline modules</span><strong>40</strong><small>Always visible on the left</small></Card><Card className="stat-card"><div className="stat-icon green"><CheckCircle2 /></div><span>Ready modules</span><strong>{readyCount}</strong><small>{40 - readyCount} need review or action</small></Card><Card className="stat-card"><div className="stat-icon blue"><ShieldCheck /></div><span>Average score</span><strong>{averageScore}</strong><small>Editable across all modules</small></Card><Card className="stat-card"><div className="stat-icon orange"><CircleAlert /></div><span>Open gaps</span><strong>{modules.flatMap((module) => module.rows).filter((row) => row.status !== "ready").length}</strong><small>Rows needing validation</small></Card></div>

    <div className="editable-baseline">
      <aside className="editable-baseline-left">
        <div className="workbook-search"><Search size={15} /><Input placeholder="Search all modules..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="workbook-count"><span>ALL BASELINE MODULES</span><Badge>{modules.length}</Badge></div>
        {groups.map((group) => filtered(group).length > 0 && <section key={group}><strong>{group}</strong>{filtered(group).map((module) => <button key={module.id} className={selected.id === module.id ? "active" : ""} onClick={() => setSelectedId(module.id)}><span>{modules.indexOf(module) + 1}</span><em>{module.name}</em><i className={module.status} /></button>)}</section>)}
      </aside>

      <main className="editable-baseline-main">
        <Card className="editable-module-head"><CardHeader><div className="module-title-edit"><span className="eyebrow">SELECTED BASELINE MODULE</span><Input value={selected.name} onChange={(event) => updateModule({ name: event.target.value })} /><Input value={selected.group} onChange={(event) => updateModule({ group: event.target.value })} /></div><div className="module-controls"><label>Score<Input type="number" min="0" max="100" value={selected.score} onChange={(event) => updateModule({ score: Number(event.target.value) })} /></label><label>Status<select className="input" value={selected.status} onChange={(event) => updateModule({ status: event.target.value as BaselineStatus })}><option value="ready">Ready</option><option value="review">Review</option><option value="action_needed">Action needed</option></select></label></div></CardHeader><CardContent><Progress value={selected.score} /><div className="baseline-progress-labels"><span>{selected.rows.length} editable baseline rows</span><strong>{selected.score}%</strong></div></CardContent></Card>

        <Card className="editable-grid-card"><CardHeader><div><h3>Editable baseline evidence grid</h3><p>Changes save automatically in this browser.</p></div><Button onClick={addRow}><Plus size={16} />Add row</Button></CardHeader><CardContent><div className="editable-grid"><table><thead><tr><th>#</th><th>Metric / Area</th><th>Observed Evidence</th><th>Business Impact</th><th>Gap / Validation Needed</th><th>Status</th><th /></tr></thead><tbody>{selected.rows.map((row, index) => <tr key={row.id}><td className="row-number">{index + 1}</td><td><Textarea value={row.metric} onChange={(event) => updateRow(row.id, { metric: event.target.value })} /></td><td><Textarea value={row.evidence} onChange={(event) => updateRow(row.id, { evidence: event.target.value })} /></td><td><Textarea value={row.impact} onChange={(event) => updateRow(row.id, { impact: event.target.value })} /></td><td><Textarea value={row.gap} onChange={(event) => updateRow(row.id, { gap: event.target.value })} /></td><td><select className="input" value={row.status} onChange={(event) => updateRow(row.id, { status: event.target.value as BaselineStatus })}><option value="ready">Ready</option><option value="review">Review</option><option value="action_needed">Action needed</option></select></td><td><Button variant="ghost" size="icon" onClick={() => deleteRow(row.id)}><Trash2 size={15} /></Button></td></tr>)}</tbody></table></div></CardContent></Card>
      </main>
    </div>
  </>;
}
