import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Package, FlaskConical, Cog, Droplet, Warehouse,
    Truck, BarChart3, Users, Settings, Search, Bell, ChevronDown,
    Calendar, Download, ArrowRight, Box, CheckCircle2, HardHat,
    Wind, Droplets, Cloud, Zap, HeartPulse, ShieldCheck, Shield, Fan, X, LogOut,
} from "lucide-react";

import {
    PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ─────────────────────────── Gas & Workflow Config ─────────────────────────── */

const GASES = [
    { id: "all", name: "All", fullName: "All Gases", icon: LayoutDashboard, steps: [] },
    { id: "O2", name: "O₂", fullName: "Oxygen", icon: Wind, steps: ["Logistics", "RM Lab", "Production", "FP Lab", "Distribution", "Citerne"] },
    { id: "N2O", name: "N₂O", fullName: "Nitrous Oxide", icon: Zap, steps: ["Logistics", "RM Lab", "Production", "FP Lab", "Distribution"] },
    { id: "N2", name: "N₂", fullName: "Nitrogen", icon: Cloud, steps: ["Logistics", "RM Lab", "Production", "FP Lab", "Distribution"] },
    { id: "CO2", name: "CO₂", fullName: "Carbon Dioxide", icon: FlaskConical, steps: ["Logistics", "RM Lab", "Production", "FP Lab", "Distribution"] },
    { id: "MEOPA", name: "MEOPA", fullName: "MEOPA Mix", icon: HeartPulse, steps: ["Logistics", "RM Lab", "Production", "FP Lab", "Distribution"] },
    { id: "AIR", name: "Air", fullName: "Medical Air", icon: Fan, steps: ["Logistics", "RM Lab", "Production", "FP Lab", "Distribution"] },
];

const STEP_ICON: Record<string, React.ElementType> = {
    Logistics: Package, "RM Lab": FlaskConical, Production: Cog,
    "FP Lab": FlaskConical, Distribution: Truck, Citerne: Warehouse,
};

const globalNav = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: BarChart3, label: "Reports" },
    { icon: Users, label: "Users" },
    { icon: Settings, label: "Settings" },
];

/* ─────────────────────────── Sub-Views for Each Party ─────────────────────────── */

function LogisticsView({ batches, setBatches, selectedGas }: { batches: any[], setBatches: React.Dispatch<React.SetStateAction<any[]>>, selectedGas: string }) {
    const logisticsBatches = batches.filter(b => b.party === "logistics" && b.type === "RM");
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const sendToRMLab = async (lotId: string) => {
        const res = await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
            method: "PATCH", headers,
            body: JSON.stringify({ nextParty: "rm_lab", newStatus: "pending" }),
        });
        if (res.ok) {
            const updated = await res.json();
            setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
        }
    };

    const sendToCiterne = async (lotId: string) => {
        const res = await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
            method: "PATCH", headers,
            body: JSON.stringify({ nextParty: "citerne", newStatus: "pending", type: "CITERNE", citerneType: "3C" }),
        });
        if (res.ok) {
            const updated = await res.json();
            setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Logistics Intake (Raw Materials)</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Lot ID (RM)</th>
                            <th className="px-6 py-4">Gas Type</th>
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4">Quantity</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logisticsBatches.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No raw materials currently in logistics.</td></tr>
                        ) : (
                            logisticsBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">{lot.gasId}</span></td>
                                    <td className="px-6 py-4 text-slate-700">{lot.supplier}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{lot.quantity} kg</td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(lot.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => sendToRMLab(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#00205B] text-white text-xs font-semibold rounded-lg hover:bg-[#001a4a] transition">
                                                To RM Lab <ArrowRight className="h-3 w-3" />
                                            </button>
                                            {selectedGas === "O2" && (
                                                <button onClick={() => sendToCiterne(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition">
                                                    To Citerne <Truck className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function RMLabView({ batches, setBatches }: { batches: any[], setBatches: React.Dispatch<React.SetStateAction<any[]>> }) {
    const labBatches = batches.filter(b => b.party === "rm_lab" && b.type === "RM");
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const handleAction = async (lotId: string, action: "approve" | "reject") => {
        if (action === "approve") {
            await fetch(`http://localhost:5000/api/batches/${lotId}/lab`, {
                method: "PATCH", headers, body: JSON.stringify({ purity: 99.8, co: 1.2, co2: 150, h2o: 30 })
            });
            const res = await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
                method: "PATCH", headers, body: JSON.stringify({ nextParty: "production", newStatus: "approved" })
            });
            if (res.ok) {
                const updated = await res.json();
                setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
            }
        } else {
            const res = await fetch(`http://localhost:5000/api/batches/${lotId}/reject`, { method: "PATCH", headers });
            if (res.ok) {
                const updated = await res.json();
                setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
            }
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">RM Laboratory QC (Quarantine)</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Lot ID</th><th className="px-6 py-4">Gas Type</th><th className="px-6 py-4">Supplier</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {labBatches.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No RM batches awaiting laboratory analysis.</td></tr>
                        ) : (
                            labBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">{lot.gasId}</span></td>
                                    <td className="px-6 py-4 text-slate-700">{lot.supplier}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lot.status === "ready" || lot.status === "approved" ? "bg-emerald-50 text-emerald-700" : lot.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                            {lot.status === "ready" || lot.status === "approved" ? "Conforme" : lot.status === "rejected" ? "Rejected" : "In Quarantine"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {lot.status === "pending" && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleAction(lot.lotId, "approve")} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700">
                                                    <CheckCircle2 className="h-3 w-3" /> Conforme
                                                </button>
                                                <button onClick={() => handleAction(lot.lotId, "reject")} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700">
                                                    <X className="h-3 w-3" /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ProductionView({ batches, setBatches }: { batches: any[], setBatches: React.Dispatch<React.SetStateAction<any[]>> }) {
    const prodBatches = batches.filter(b => b.party === "production" && b.type === "RM");
    const [equipe, setEquipe] = useState("Equipe A");
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const produceLot = async (rmLotId: string) => {
        const rmBatch = batches.find(b => b.lotId === rmLotId);
        const fpLotId = `${rmLotId}-01`;

        const res = await fetch(`http://localhost:5000/api/batches/produce`, {
            method: "POST", headers,
            body: JSON.stringify({ rmLotId, fpLotId, gasId: rmBatch?.gasId, equipe, quantity: rmBatch?.quantity })
        });

        if (res.ok) {
            const newFP = await res.json();
            setBatches(prev => [
                ...prev.map(b => b.lotId === rmLotId ? { ...b, status: "processed" } : b),
                newFP
            ]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Production (Lot Creation)</h2>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">Equipe:</label>
                    <select value={equipe} onChange={(e) => setEquipe(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <option>Equipe A</option><option>Equipe B</option><option>Equipe C</option>
                    </select>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr><th className="px-6 py-4">RM Lot ID</th><th className="px-6 py-4">Gas Type</th><th className="px-6 py-4">Quantity</th><th className="px-6 py-4">Date</th><th className="px-6 py-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {prodBatches.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No approved RM ready for production.</td></tr>
                        ) : (
                            prodBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">{lot.gasId}</span></td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{lot.quantity} kg</td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(lot.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => produceLot(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition">
                                            Produce FP Lot <Cog className="h-3 w-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function FPLabView({ batches, setBatches }: { batches: any[], setBatches: React.Dispatch<React.SetStateAction<any[]>> }) {
    const labBatches = batches.filter(b => b.party === "fp_lab" && b.type === "FP");
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const handleAction = async (lotId: string, action: "approve" | "reject") => {
        if (action === "approve") {
            await fetch(`http://localhost:5000/api/batches/${lotId}/lab`, {
                method: "PATCH", headers, body: JSON.stringify({ purity: 99.8, co: 1.2, co2: 150, h2o: 30 })
            });
            const res = await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
                method: "PATCH", headers, body: JSON.stringify({ nextParty: "distribution", newStatus: "approved" })
            });
            if (res.ok) {
                const updated = await res.json();
                setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
            }
        } else {
            const res = await fetch(`http://localhost:5000/api/batches/${lotId}/reject`, { method: "PATCH", headers });
            if (res.ok) {
                const updated = await res.json();
                setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
            }
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">FP Laboratory QC (Quarantine)</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr><th className="px-6 py-4">FP Lot ID</th><th className="px-6 py-4">Gas Type</th><th className="px-6 py-4">Equipe</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {labBatches.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No FP batches awaiting laboratory analysis.</td></tr>
                        ) : (
                            labBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded">{lot.gasId}</span></td>
                                    <td className="px-6 py-4 text-slate-700">{lot.equipe}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lot.status === "ready" || lot.status === "approved" ? "bg-emerald-50 text-emerald-700" : lot.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                            {lot.status === "ready" || lot.status === "approved" ? "Conforme" : lot.status === "rejected" ? "Rejected" : "In Quarantine"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {lot.status === "pending" && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleAction(lot.lotId, "approve")} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700">
                                                    <CheckCircle2 className="h-3 w-3" /> Conforme
                                                </button>
                                                <button onClick={() => handleAction(lot.lotId, "reject")} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700">
                                                    <X className="h-3 w-3" /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DistributionView({ batches, setBatches }: { batches: any[], setBatches: React.Dispatch<React.SetStateAction<any[]>> }) {
    const distBatches = batches.filter(b => b.party === "distribution" && b.type === "FP");
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const dispatchBatch = async (lotId: string) => {
        const res = await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
            method: "PATCH", headers, body: JSON.stringify({ newStatus: "delivered" })
        });
        if (res.ok) {
            const updated = await res.json();
            setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Distribution (Final Products)</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr><th className="px-6 py-4">FP Lot ID</th><th className="px-6 py-4">Gas Type</th><th className="px-6 py-4">Equipe</th><th className="px-6 py-4">Quantity</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {distBatches.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No FP batches ready for distribution.</td></tr>
                        ) : (
                            distBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">{lot.gasId}</span></td>
                                    <td className="px-6 py-4 text-slate-700">{lot.equipe}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{lot.quantity} bottles</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lot.status === "delivered" ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"}`}>
                                            {lot.status === "delivered" ? "Delivered" : "Ready to Ship"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {lot.status !== "delivered" && (
                                            <button onClick={() => dispatchBatch(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#00205B] text-white text-xs font-semibold rounded-lg hover:bg-[#001a4a] transition">
                                                Dispatch <Truck className="h-3 w-3" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CiterneView({ batches, setBatches }: { batches: any[], setBatches: React.Dispatch<React.SetStateAction<any[]>> }) {
    const citerneBatches = batches.filter(b => b.type === "CITERNE");
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const sendToCiterneLab = async (lotId: string) => {
        const res = await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
            method: "PATCH", headers, body: JSON.stringify({ nextParty: "citerne_lab", newStatus: "pending" })
        });
        if (res.ok) {
            const updated = await res.json();
            setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
        }
    };

    const approveCiterne = async (lotId: string) => {
        await fetch(`http://localhost:5000/api/batches/${lotId}/lab`, {
            method: "PATCH", headers, body: JSON.stringify({ purity: 99.9 })
        });
        const res = await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
            method: "PATCH", headers, body: JSON.stringify({ nextParty: "citerne_distribution", newStatus: "approved" })
        });
        if (res.ok) {
            const updated = await res.json();
            setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">O₂ Citerne Distribution (3C, 4C, 7C)</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr><th className="px-6 py-4">Citerne Code</th><th className="px-6 py-4">Citerne Type</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {citerneBatches.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No O₂ Citernes in process.</td></tr>
                        ) : (
                            citerneBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded">{lot.citerneType}</span></td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lot.status === "approved" || lot.status === "ready" ? "bg-emerald-50 text-emerald-700" :
                                            lot.party === "citerne_lab" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"
                                            }`}>
                                            {lot.status === "approved" || lot.status === "ready" ? "Ready for Delivery" : lot.party === "citerne_lab" ? "In Lab Analysis" : "Awaiting Lab"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {lot.status !== "approved" && lot.status !== "ready" && (
                                            lot.party === "citerne" ? (
                                                <button onClick={() => sendToCiterneLab(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">
                                                    Send to Lab <FlaskConical className="h-3 w-3" />
                                                </button>
                                            ) : (
                                                <button onClick={() => approveCiterne(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition">
                                                    Approve & Dispatch <CheckCircle2 className="h-3 w-3" />
                                                </button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ─────────────────────────── Reports & Settings (Unchanged) ─────────────────────────── */
// (Keep your ReportsView and SettingsView exactly as they were in the previous snippet)
function ReportCard({ title, description, icon: Icon, color, onClick }: any) {
    return (
        <button onClick={onClick} className="flex flex-col items-start p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition text-left">
            <div className={`grid h-10 w-10 place-items-center rounded-lg ${color} mb-3`}><Icon size={20} /></div>
            <h4 className="text-base font-semibold text-slate-900">{title}</h4>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </button>
    );
}

function ReportsView({ batches }: { batches: any[] }) {
    const [reportType, setReportType] = useState("production");
    const generateCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Lot ID,Gas Type,Type,Party,Status,Quantity,Date\n";
        batches.forEach(b => { csvContent += `${b.lotId},${b.gasId},${b.type},${b.party},${b.status},${b.quantity},${new Date(b.date).toLocaleDateString()}\n`; });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
                <button onClick={generateCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-[#00205B] text-white text-sm font-semibold rounded-lg hover:bg-[#001a4a] transition">
                    <Download className="h-4 w-4" /> Export Data (CSV)
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportCard title="Production Summary" description="Overview of all FP lots produced, grouped by gas and equipe." icon={Cog} color="bg-purple-50 text-purple-600" onClick={() => setReportType("production")} />
                <ReportCard title="QC Rejections" description="Detailed log of all batches rejected during RM or FP quarantine." icon={X} color="bg-red-50 text-red-600" onClick={() => setReportType("qc")} />
                <ReportCard title="Logistics Intake" description="Raw materials received, supplier performance, and quarantine times." icon={Truck} color="bg-blue-50 text-blue-600" onClick={() => setReportType("logistics")} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Preview: {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Data</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                            <tr><th className="px-4 py-3">Lot ID</th><th className="px-4 py-3">Gas</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Date</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {batches.slice(0, 10).map(b => (
                                <tr key={b._id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono font-medium">{b.lotId}</td>
                                    <td className="px-4 py-3">{b.gasId}</td>
                                    <td className="px-4 py-3">{b.type}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'approved' || b.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : b.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{b.status}</span></td>
                                    <td className="px-4 py-3">{b.quantity}</td>
                                    <td className="px-4 py-3 text-slate-500">{new Date(b.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function SettingsView() {
    const [companyName, setCompanyName] = useState("Air Liquide Medical");
    const [quarantineDays, setQuarantineDays] = useState(3);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [saved, setSaved] = useState(false);
    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

    return (
        <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
            {saved && (<div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg"><CheckCircle2 size={18} /> Settings saved successfully!</div>)}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">General Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label><input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Default Quarantine Duration (Days)</label><input type="number" value={quarantineDays} onChange={(e) => setQuarantineDays(parseInt(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" /></div>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">Notifications</h3>
                <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-900">Email Alerts for Rejections</p><p className="text-xs text-slate-500">Receive an email when a batch is rejected in the lab.</p></div><button onClick={() => setEmailNotifs(!emailNotifs)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${emailNotifs ? 'bg-blue-600' : 'bg-slate-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${emailNotifs ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
            </div>
            <div className="flex justify-end"><button onClick={handleSave} className="px-6 py-2.5 bg-[#00205B] text-white font-semibold rounded-lg hover:bg-[#001a4a] transition shadow-sm">Save Changes</button></div>
        </div>
    );
}

/* ─────────────────────────── Shared Components ─────────────────────────── */

function KpiCard({ kpi }: { kpi: any }) {
    const Icon = kpi.icon;
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-start gap-3">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${kpi.bg} ${kpi.color}`}><Icon size={22} strokeWidth={2} /></div>
                <div className="leading-tight"><div className="text-3xl font-bold text-slate-900">{kpi.value}</div><div className="mt-0.5 whitespace-pre-line text-[13px] font-medium text-slate-600">{kpi.label}</div></div>
            </div>
            <div className={`mt-3 text-xs font-semibold ${kpi.trendColor}`}>{kpi.up ? "▲" : "▼"} {kpi.delta}% vs yesterday</div>
        </div>
    );
}

function GasSidebar({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
    return (
        <aside className="flex w-20 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="flex-1 overflow-y-auto py-2">
                {GASES.map((gas) => {
                    const Icon = gas.icon; const active = selected === gas.id;
                    return (<button key={gas.id} onClick={() => onSelect(gas.id)} className={`flex w-full flex-col items-center gap-1 px-1 py-3 text-[10px] font-semibold transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}><Icon size={20} strokeWidth={active ? 2.5 : 2} /><span className="leading-tight">{gas.name}</span></button>);
                })}
            </div>
        </aside>
    );
}

function PartySidebar({ gasId, party, onParty, onOpenCalendar }: { gasId: string; party: string; onParty: (p: string) => void; onOpenCalendar: () => void }) {
    const gas = GASES.find((g) => g.id === gasId) || GASES[0];
    const user = JSON.parse(localStorage.getItem("user") || '{"role": "admin"}');
    return (
        <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
            <div className="flex h-16 items-center justify-center border-b border-slate-200"><img src="/air-liquide.png" alt="Air Liquide Logo" className="h-10 w-auto" /></div>
            <div className="px-4 pt-4"><div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Selected Gas</div><div className="mt-1 text-sm font-bold text-slate-900">{gas.fullName}</div></div>
            <nav className="flex-1 space-y-1 p-3">
                <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Workflow</div>
                {gas.steps.map((step) => {
                    const StepIcon = STEP_ICON[step] || Box; const active = party === step;
                    return (<button key={step} onClick={() => onParty(step)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:shadow-sm"}`}><StepIcon size={18} strokeWidth={2} />{step}</button>);
                })}
                {user.role === "admin" && (
                    <>
                        <div className="my-3 border-t border-slate-200" />
                        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Pages</div>
                        {globalNav.map((item) => {
                            const Icon = item.icon; const active = party === item.label;
                            return (<button key={item.label} onClick={() => { if (item.label === "System Calendar") onOpenCalendar(); else onParty(item.label); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:shadow-sm"}`}><Icon size={18} strokeWidth={2} />{item.label}</button>);
                        })}
                    </>
                )}
            </nav>
            <div className="mx-3 mb-4 rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600"><HardHat size={20} /></div><div><div className="text-xs font-bold text-slate-900">Safety is our priority</div><div className="mt-0.5 text-[10px] leading-snug text-slate-500">Work safely today for a better tomorrow</div></div></div></div>
        </aside>
    );
}


function Topbar({ onOpenCalendar }: { onOpenCalendar: () => void }) {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fallback to Maroua Guesmi if no user is found in localStorage
    const user = JSON.parse(localStorage.getItem("user") || '{"fullName": "Maroua Guesmi", "role": "admin"}');

    const parties = [
        { label: "Admin Dashboard", role: "admin", icon: LayoutDashboard, path: "/dashboard/admin" },
        { label: "Logistics", role: "logistics", icon: Package, path: "/dashboard/logistics" },
        { label: "Laboratory", role: "laboratory", icon: FlaskConical, path: "/dashboard/laboratory" },
        { label: "Production", role: "production", icon: Cog, path: "/dashboard/production" },
        { label: "Distribution", role: "distribution", icon: Truck, path: "/dashboard/distribution" },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSwitchParty = (path: string) => {
        setIsDropdownOpen(false);
        navigate(path);
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
            <div>
                <h1 className="text-[26px] font-bold leading-none text-slate-900">Dashboard</h1>
                <p className="mt-1.5 text-sm text-slate-500">Overview of today's operations</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search batch, material, order…"
                        className="h-10 w-[320px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <button
                    onClick={onOpenCalendar}
                    className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <Calendar size={16} className="text-blue-600" />
                    System Calendar
                </button>

                {/* User & Party Switcher Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-600">
                            <Users size={18} />
                        </div>
                        <div className="leading-tight text-left">
                            <div className="text-sm font-semibold text-slate-900">{user.fullName || "Maroua Guesmi"}</div>
                            <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                        </div>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg py-2 z-50">
                            <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Switch Department</p>
                            </div>
                            {parties.map((party) => {
                                const Icon = party.icon;
                                return (
                                    <button
                                        key={party.role}
                                        onClick={() => handleSwitchParty(party.path)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        <Icon size={18} />
                                        <span className="font-medium">{party.label}</span>
                                        {user.role === party.role && (
                                            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                                Current
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                            <div className="border-t border-slate-100 mt-1 pt-1">
                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        navigate("/login");
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={18} />
                                    <span className="font-medium">Log Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

/* ─────────────────────────── Main Dashboard Page ─────────────────────────── */

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [selectedGas, setSelectedGas] = useState("all");
    const [selectedParty, setSelectedParty] = useState("Dashboard");
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Strictly fetches from Backend API
    useEffect(() => {
        const fetchBatches = async () => {
            setIsLoading(true);
            const token = localStorage.getItem("token");
            if (!token) { navigate("/login"); return; }
            try {
                let url = "http://localhost:5000/api/batches";
                if (selectedGas !== "all") url += `?gasId=${selectedGas}`;
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    setBatches(await res.json());
                } else if (res.status === 401) {
                    localStorage.clear(); navigate("/login");
                }
            } catch (err) {
                console.error("Failed to fetch batches", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBatches();
    }, [selectedGas, navigate]);

    const kpis = useMemo(() => [
        { label: "RM\nReceived", value: batches.filter(b => b.party === "logistics" && b.type === "RM").length, delta: 20, up: true, icon: Box, bg: "bg-blue-50", color: "text-blue-600", trendColor: "text-emerald-600" },
        { label: "RM in\nQuarantine", value: batches.filter(b => b.party === "rm_lab" && b.type === "RM").length, delta: 33, up: true, icon: FlaskConical, bg: "bg-amber-50", color: "text-amber-500", trendColor: "text-amber-600" },
        { label: "RM\nApproved", value: batches.filter(b => b.party === "production" && b.type === "RM").length, delta: 12, up: true, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600", trendColor: "text-emerald-600" },
        { label: "FP in\nQuarantine", value: batches.filter(b => b.party === "fp_lab" && b.type === "FP").length, delta: 16, up: true, icon: FlaskConical, bg: "bg-purple-50", color: "text-purple-600", trendColor: "text-purple-600" },
        { label: "Ready for\nShipping", value: batches.filter(b => b.party === "distribution" && b.type === "FP").length, delta: 10, up: false, icon: Truck, bg: "bg-cyan-50", color: "text-cyan-600", trendColor: "text-red-500" },
        { label: "O₂ Citerne\nProcess", value: batches.filter(b => b.type === "CITERNE" && b.status !== "approved" && b.status !== "ready").length, delta: 5, up: true, icon: Warehouse, bg: "bg-orange-50", color: "text-orange-600", trendColor: "text-emerald-600" },
        { label: "Rejected\nBatches", value: batches.filter(b => b.status === "rejected").length, delta: 50, up: false, icon: X, bg: "bg-red-50", color: "text-red-500", trendColor: "text-red-500" },
    ], [batches]);

    const flowSteps = useMemo(() => [
        { label: "RM\nReceived", icon: Box, count: batches.filter(b => b.party === "logistics" && b.type === "RM").length, tint: "bg-blue-50 text-blue-600" },
        { label: "RM\nQuarantine", icon: FlaskConical, count: batches.filter(b => b.party === "rm_lab").length, tint: "bg-amber-50 text-amber-500" },
        { label: "In\nProduction", icon: Cog, count: batches.filter(b => b.party === "production").length, tint: "bg-purple-50 text-purple-600" },
        { label: "FP\nQuarantine", icon: FlaskConical, count: batches.filter(b => b.party === "fp_lab").length, tint: "bg-cyan-50 text-cyan-600" },
        { label: "Ready to\nShip", icon: Warehouse, count: batches.filter(b => b.party === "distribution" && b.status !== "delivered").length, tint: "bg-emerald-50 text-emerald-600" },
        { label: "Delivered", icon: Truck, count: batches.filter(b => b.status === "delivered").length, tint: "bg-slate-100 text-slate-600" },
    ], [batches]);

    const activities = useMemo(() => {
        const allHistory: any[] = [];
        batches.forEach(batch => {
            if (batch.history) {
                batch.history.forEach((h: any) => { allHistory.push({ ...h, lotId: batch.lotId, gasId: batch.gasId }); });
            }
        });
        allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return allHistory.slice(0, 5).map((h) => {
            let badge = "Info", badgeClass = "bg-slate-100 text-slate-700", dot = "bg-slate-500";
            if (h.action.includes("Created")) { badge = "Logistics"; badgeClass = "bg-indigo-50 text-indigo-700"; dot = "bg-indigo-500"; }
            else if (h.action.includes("Lab")) { badge = "Laboratory"; badgeClass = "bg-amber-50 text-amber-700"; dot = "bg-amber-500"; }
            else if (h.action.includes("Production")) { badge = "Production"; badgeClass = "bg-blue-50 text-blue-700"; dot = "bg-blue-500"; }
            else if (h.action.includes("Rejected")) { badge = "Rejected"; badgeClass = "bg-red-50 text-red-700"; dot = "bg-red-500"; }
            else if (h.action.includes("Moved")) { badge = "Moved"; badgeClass = "bg-emerald-50 text-emerald-700"; dot = "bg-emerald-500"; }
            return { time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: `Batch ${h.lotId} (${h.gasId}): ${h.action}`, badge, badgeClass, dot };
        });
    }, [batches]);

    const topMaterials = useMemo(() => {
        const counts: Record<string, number> = {};
        const key = selectedGas === "all" ? "gasId" : "supplier";
        batches.forEach(b => {
            let qty = 0;
            if (typeof b.quantity === 'number') qty = b.quantity;
            else if (typeof b.quantity === 'string') qty = parseInt(b.quantity.replace(/[^0-9]/g, '') || "0");
            const name = key === "gasId" ? (b.gasId || "Unknown") : (b.supplier || "Unknown Supplier");
            counts[name] = (counts[name] || 0) + (isNaN(qty) ? 0 : qty);
        });
        const colors = ["#2563eb", "#10b981", "#f59e0b", "#a855f7", "#ef4444", "#64748b"];
        return Object.entries(counts).map(([name, kg], idx) => ({ name, kg, color: colors[idx % colors.length] })).sort((a, b) => b.kg - a.kg).slice(0, 5);
    }, [batches, selectedGas]);

    const totalMat = topMaterials.reduce((s, m) => s + m.kg, 0);

    const productionSeries = useMemo(() => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const series = days.map(day => ({ day, received: 0, completed: 0 }));
        batches.forEach(b => {
            const d = new Date(b.date); const dayName = days[d.getDay()];
            const entry = series.find(s => s.day === dayName);
            if (entry) { entry.received += 1; if (b.status === "approved" || b.status === "delivered" || b.status === "ready") entry.completed += 1; }
        });
        return series;
    }, [batches]);

    const batchStatus = useMemo(() => {
        const statusCounts = { Completed: 0, "In Progress": 0, Pending: 0, Rejected: 0 };
        batches.forEach(b => {
            if (b.status === "rejected") statusCounts.Rejected++;
            else if (b.party === "logistics") statusCounts.Pending++;
            else if (["production", "rm_lab", "fp_lab", "citerne", "citerne_lab"].includes(b.party)) statusCounts["In Progress"]++;
            else statusCounts.Completed++;
        });
        return [{ name: "Completed", value: statusCounts.Completed, color: "#10b981" }, { name: "In Progress", value: statusCounts["In Progress"], color: "#3b82f6" }, { name: "Pending", value: statusCounts.Pending, color: "#f59e0b" }, { name: "Rejected", value: statusCounts.Rejected, color: "#ef4444" }].filter(s => s.value > 0);
    }, [batches]);

    const totalBatch = batchStatus.reduce((s, b) => s + b.value, 0);
    const completedBatches = batchStatus.find(s => s.name === "Completed")?.value || 0;
    const progressPercent = totalBatch > 0 ? Math.round((completedBatches / totalBatch) * 100) : 0;

    if (isLoading) {
        return (<div className="flex h-screen items-center justify-center bg-[#f8fafc]"><div className="flex flex-col items-center gap-3 text-slate-500"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div><span className="text-sm font-medium">Loading dashboard data...</span></div></div>);
    }

    return (
        <div className="flex h-screen bg-[#f8fafc]">
            <GasSidebar selected={selectedGas} onSelect={(id) => { setSelectedGas(id); setSelectedParty("Dashboard"); }} />
            <PartySidebar gasId={selectedGas} party={selectedParty} onParty={setSelectedParty} onOpenCalendar={() => navigate('/calendar')} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar onOpenCalendar={() => navigate('/calendar')} />
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {selectedParty === "Logistics" && <LogisticsView batches={batches} setBatches={setBatches} selectedGas={selectedGas} />}
                    {selectedParty === "RM Lab" && <RMLabView batches={batches} setBatches={setBatches} />}
                    {selectedParty === "Production" && <ProductionView batches={batches} setBatches={setBatches} />}
                    {selectedParty === "FP Lab" && <FPLabView batches={batches} setBatches={setBatches} />}
                    {selectedParty === "Distribution" && <DistributionView batches={batches} setBatches={setBatches} />}
                    {selectedParty === "Citerne" && <CiterneView batches={batches} setBatches={setBatches} />}
                    {selectedParty === "Reports" && <ReportsView batches={batches} />}
                    {selectedParty === "Settings" && <SettingsView />}

                    {selectedParty === "Dashboard" && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">{kpis.map((k, i) => <KpiCard key={i} kpi={k} />)}</div>
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="mb-6 text-base font-semibold text-slate-900">Production Flow</h2>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        {flowSteps.map((step, i) => {
                                            const Icon = step.icon;
                                            return (<React.Fragment key={step.label}><div className="flex flex-col items-center text-center flex-1 min-w-[80px]"><div className={`grid h-12 w-12 place-items-center rounded-full ${step.tint}`}><Icon size={20} strokeWidth={2} /></div><div className="mt-2 max-w-[88px] whitespace-pre-line text-[11.5px] font-medium leading-tight text-slate-600">{step.label}</div><div className="mt-1 text-xl font-bold text-slate-900">{step.count}</div></div>{i < flowSteps.length - 1 && <ArrowRight size={16} className="hidden lg:block shrink-0 text-slate-300" />}</React.Fragment>);
                                        })}
                                    </div>
                                    <div className="mt-8"><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium text-slate-700">Overall Progress</span><span className="font-semibold text-blue-600">{progressPercent}%</span></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPercent}%` }} /></div></div>
                                </div>
                                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">Recent Activity</h2><button className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50">View All</button></div>
                                    <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[320px]">
                                        {activities.length === 0 ? (<li className="py-8 text-sm text-slate-500 text-center">No recent activity recorded</li>) : (
                                            activities.map((a, i) => (<li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${a.dot}`} /><span className="w-[52px] shrink-0 text-xs font-medium text-slate-500">{a.time}</span><span className="flex-1 text-sm leading-snug text-slate-700 truncate" title={a.text}>{a.text}</span><span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${a.badgeClass}`}>{a.badge}</span></li>))
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-4 flex items-baseline gap-2"><h2 className="text-base font-semibold text-slate-900">{selectedGas === "all" ? "Top Materials" : "Top Suppliers"}</h2><span className="text-xs text-slate-400">(This Month)</span></div>
                                    <div className="flex items-center gap-5">
                                        <div className="relative h-[180px] w-[180px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={topMaterials} innerRadius={58} outerRadius={85} paddingAngle={2} dataKey="kg" stroke="none">{topMaterials.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div>
                                        <div className="flex-1"><ul className="divide-y divide-slate-100">{topMaterials.map((m) => (<li key={m.name} className="grid grid-cols-[1fr_auto] items-center gap-x-4 py-1.5 text-sm"><span className="flex items-center gap-2 text-slate-700"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />{m.name}</span><span className="font-semibold text-slate-900">{m.kg.toLocaleString()}</span></li>))}</ul><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm font-semibold text-slate-700">Total</span><span className="text-sm font-bold text-slate-900">{totalMat.toLocaleString()} kg</span></div></div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-3 flex items-baseline gap-2"><h2 className="text-base font-semibold text-slate-900">Weekly Overview</h2><span className="text-xs text-slate-400">(Last 7 Days)</span></div>
                                    <div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={productionSeries} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" /><XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 4 }} /><Line type="monotone" dataKey="received" name="Received" stroke="#93bbfd" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: "#93bbfd" }} /><Line type="monotone" dataKey="completed" name="Completed" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#2563eb" }} /></LineChart></ResponsiveContainer></div>
                                </div>
                                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="mb-2 text-base font-semibold text-slate-900">Batch Status</h2>
                                    <div className="flex items-center gap-5">
                                        <div className="relative h-[160px] w-[160px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={batchStatus} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">{batchStatus.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div>
                                        <div className="flex-1"><div className="mb-3 flex items-baseline justify-between"><span className="text-xs text-slate-500">Total Batches</span><span className="text-2xl font-bold text-slate-900">{totalBatch}</span></div><ul className="space-y-2.5">{batchStatus.map((b) => (<li key={b.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-slate-700"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />{b.name}</span><span className="text-slate-500"><span className="font-semibold text-slate-900">{b.value}</span> ({totalBatch > 0 ? ((b.value / totalBatch) * 100).toFixed(1) : 0}%)</span></li>))}</ul></div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}