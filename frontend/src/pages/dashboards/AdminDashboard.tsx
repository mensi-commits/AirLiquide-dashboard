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

import { useLanguage } from "../../hooks/useLanguage"; // Adjust path if needed

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
    const { t } = useLanguage();
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
            method: "PATCH",
            headers,
            body: JSON.stringify({
                nextParty: "citerne_lab", // Direct to lab, skipping admin holding state
                newStatus: "pending",
                type: "CITERNE",
                citerneType: "3C"
            }),
        });
        if (res.ok) {
            const updated = await res.json();
            setBatches(prev => prev.map(b => b._id === updated._id ? updated : b));
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{t("logistics_intake")}</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">{t("lot_id_rm")}</th>
                            <th className="px-6 py-4">{t("gas_type")}</th>
                            <th className="px-6 py-4">{t("supplier")}</th>
                            <th className="px-6 py-4">{t("quantity")}</th>
                            <th className="px-6 py-4">{t("date")}</th>
                            <th className="px-6 py-4 text-right">{t("action")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logisticsBatches.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">{t("no_raw_materials")}</td></tr>
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
                                                {t("to_rm_lab")} <ArrowRight className="h-3 w-3" />
                                            </button>
                                            {selectedGas === "O2" && (
                                                <button onClick={() => sendToCiterne(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition">
                                                    {t("to_citerne")} <Truck className="h-3 w-3" />
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
    const { t } = useLanguage();
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
            <h2 className="text-xl font-bold text-slate-900">{t("rm_lab_qc")}</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">{t("lot_id")}</th><th className="px-6 py-4">{t("gas_type")}</th><th className="px-6 py-4">{t("supplier")}</th><th className="px-6 py-4">{t("status")}</th><th className="px-6 py-4 text-right">{t("actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {labBatches.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">{t("no_rm_batches")}</td></tr>
                        ) : (
                            labBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">{lot.gasId}</span></td>
                                    <td className="px-6 py-4 text-slate-700">{lot.supplier}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lot.status === "ready" || lot.status === "approved" ? "bg-emerald-50 text-emerald-700" : lot.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                            {lot.status === "ready" || lot.status === "approved" ? t("conforme") : lot.status === "rejected" ? t("rejected") : t("in_quarantine")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {lot.status === "pending" && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleAction(lot.lotId, "approve")} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700">
                                                    <CheckCircle2 className="h-3 w-3" /> {t("conforme")}
                                                </button>
                                                <button onClick={() => handleAction(lot.lotId, "reject")} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700">
                                                    <X className="h-3 w-3" /> {t("reject")}
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
    const { t } = useLanguage();
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
                <h2 className="text-xl font-bold text-slate-900">{t("production_lot_creation")}</h2>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">{t("equipe")}:</label>
                    <select value={equipe} onChange={(e) => setEquipe(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <option>Equipe A</option><option>Equipe B</option><option>Equipe C</option>
                    </select>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr><th className="px-6 py-4">{t("rm_lot_id")}</th><th className="px-6 py-4">{t("gas_type")}</th><th className="px-6 py-4">{t("quantity")}</th><th className="px-6 py-4">{t("date")}</th><th className="px-6 py-4 text-right">{t("action")}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {prodBatches.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">{t("no_approved_rm")}</td></tr>
                        ) : (
                            prodBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">{lot.gasId}</span></td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{lot.quantity} kg</td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(lot.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => produceLot(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition">
                                            {t("produce_fp_lot")} <Cog className="h-3 w-3" />
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
    const { t } = useLanguage();
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
            <h2 className="text-xl font-bold text-slate-900">{t("fp_lab_qc")}</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr><th className="px-6 py-4">{t("fp_lot_id")}</th><th className="px-6 py-4">{t("gas_type")}</th><th className="px-6 py-4">{t("equipe")}</th><th className="px-6 py-4">{t("status")}</th><th className="px-6 py-4 text-right">{t("actions")}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {labBatches.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">{t("no_fp_batches")}</td></tr>
                        ) : (
                            labBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded">{lot.gasId}</span></td>
                                    <td className="px-6 py-4 text-slate-700">{lot.equipe}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lot.status === "ready" || lot.status === "approved" ? "bg-emerald-50 text-emerald-700" : lot.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                            {lot.status === "ready" || lot.status === "approved" ? t("conforme") : lot.status === "rejected" ? t("rejected") : t("in_quarantine")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {lot.status === "pending" && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleAction(lot.lotId, "approve")} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700">
                                                    <CheckCircle2 className="h-3 w-3" /> {t("conforme")}
                                                </button>
                                                <button onClick={() => handleAction(lot.lotId, "reject")} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700">
                                                    <X className="h-3 w-3" /> {t("reject")}
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
    const { t } = useLanguage();
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
            <h2 className="text-xl font-bold text-slate-900">{t("distribution_final_products")}</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr><th className="px-6 py-4">{t("fp_lot_id")}</th><th className="px-6 py-4">{t("gas_type")}</th><th className="px-6 py-4">{t("equipe")}</th><th className="px-6 py-4">{t("quantity")}</th><th className="px-6 py-4">{t("status")}</th><th className="px-6 py-4 text-right">{t("action")}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {distBatches.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">{t("no_fp_batches_dist")}</td></tr>
                        ) : (
                            distBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">{lot.gasId}</span></td>
                                    <td className="px-6 py-4 text-slate-700">{lot.equipe}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{lot.quantity} bottles</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lot.status === "delivered" ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"}`}>
                                            {lot.status === "delivered" ? t("delivered") : t("ready_to_ship")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {lot.status !== "delivered" && (
                                            <button onClick={() => dispatchBatch(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#00205B] text-white text-xs font-semibold rounded-lg hover:bg-[#001a4a] transition">
                                                {t("dispatch")} <Truck className="h-3 w-3" />
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
    const { t } = useLanguage();
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
            <h2 className="text-xl font-bold text-slate-900">{t("o2_citerne_dist")}</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr><th className="px-6 py-4">{t("citerne_code")}</th><th className="px-6 py-4">{t("citerne_type")}</th><th className="px-6 py-4">{t("status")}</th><th className="px-6 py-4 text-right">{t("action")}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {citerneBatches.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">{t("no_o2_citernes")}</td></tr>
                        ) : (
                            citerneBatches.map((lot) => (
                                <tr key={lot._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{lot.lotId}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded">{lot.citerneType}</span></td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lot.status === "approved" || lot.status === "ready" ? "bg-emerald-50 text-emerald-700" :
                                            lot.party === "citerne_lab" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"
                                            }`}>
                                            {lot.status === "approved" || lot.status === "ready" ? t("ready_for_delivery") : lot.party === "citerne_lab" ? t("in_lab_analysis") : t("awaiting_lab")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {lot.status !== "approved" && lot.status !== "ready" && (
                                            lot.party === "citerne" ? (
                                                <button onClick={() => sendToCiterneLab(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">
                                                    {t("send_to_lab")} <FlaskConical className="h-3 w-3" />
                                                </button>
                                            ) : (
                                                <button onClick={() => approveCiterne(lot.lotId)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition">
                                                    {t("approve_dispatch")} <CheckCircle2 className="h-3 w-3" />
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

/* ─────────────────────────── Reports, Users & Settings ─────────────────────────── */
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
    const { t } = useLanguage();
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
                <h2 className="text-2xl font-bold text-slate-900">{t("reports_analytics")}</h2>
                <button onClick={generateCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-[#00205B] text-white text-sm font-semibold rounded-lg hover:bg-[#001a4a] transition">
                    <Download className="h-4 w-4" /> {t("export_data_csv")}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportCard title={t("production_summary")} description={t("production_summary_desc")} icon={Cog} color="bg-purple-50 text-purple-600" onClick={() => setReportType("production")} />
                <ReportCard title={t("qc_rejections")} description={t("qc_rejections_desc")} icon={X} color="bg-red-50 text-red-600" onClick={() => setReportType("qc")} />
                <ReportCard title={t("logistics_intake_report")} description={t("logistics_intake_report_desc")} icon={Truck} color="bg-blue-50 text-blue-600" onClick={() => setReportType("logistics")} />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t("preview_data")}: {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                            <tr><th className="px-4 py-3">{t("lot_id")}</th><th className="px-4 py-3">{t("gas")}</th><th className="px-4 py-3">{t("type")}</th><th className="px-4 py-3">{t("status")}</th><th className="px-4 py-3">{t("quantity")}</th><th className="px-4 py-3">{t("date")}</th></tr>
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

function UsersView() {
    const { t } = useLanguage();
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [newFullName, setNewFullName] = useState("");
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/users", { headers });
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUser = async (userId: string) => {
        try {
            const payload: any = {};
            if (newFullName) payload.fullName = newFullName;
            if (newPassword) payload.password = newPassword;

            const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setMessage("User updated successfully!");
                setEditingUser(null);
                setNewPassword("");
                setNewFullName("");
                fetchUsers();
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (err) {
            console.error("Failed to update user", err);
        }
    };

    if (isLoading) return <div className="p-6 text-center text-slate-500">{t("loading")}</div>;

    return (
        <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">{t("users_management")}</h2>
            {message && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                    <CheckCircle2 size={18} /> {message}
                </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">{t("username")}</th>
                            <th className="px-6 py-4">{t("full_name")}</th>
                            <th className="px-6 py-4">{t("role")}</th>
                            <th className="px-6 py-4 text-right">{t("actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{user.username}</td>
                                <td className="px-6 py-4 text-slate-700">{user.fullName || "-"}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded capitalize">
                                        {t(user.role)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {editingUser === user._id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={newFullName}
                                                onChange={(e) => setNewFullName(e.target.value)}
                                                className="w-32 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                            />
                                            <input
                                                type="password"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-32 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => handleUpdateUser(user._id)}
                                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
                                            >
                                                {t("save")}
                                            </button>
                                            <button
                                                onClick={() => { setEditingUser(null); setNewPassword(""); setNewFullName(""); }}
                                                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300"
                                            >
                                                {t("cancel")}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setEditingUser(user._id); setNewFullName(user.fullName || ""); }}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                                        >
                                            {t("edit")}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SettingsView() {
    const { t } = useLanguage();
    const [companyName, setCompanyName] = useState("Air Liquide Medical");
    const [quarantineDays, setQuarantineDays] = useState(3);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [language, setLanguage] = useState("en");
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/settings", { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data.companyName) setCompanyName(data.companyName);
                    if (data.quarantineDays) setQuarantineDays(data.quarantineDays);
                    if (data.language) setLanguage(data.language);
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/settings", {
                method: "PATCH",
                headers,
                body: JSON.stringify({ companyName, quarantineDays, language })
            });
            if (res.ok) {
                setSaved(true);
                localStorage.setItem("appLanguage", language);
                window.dispatchEvent(new Event("languageChanged"));
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error("Failed to save settings", err);
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center text-slate-500">{t("loading_settings")}</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900">{t("system_settings")}</h2>
            {saved && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                    <CheckCircle2 size={18} /> {t("settings_saved")}
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">{t("general_config")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t("company_name")}</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t("quarantine_days")}</label>
                        <input type="number" value={quarantineDays} onChange={(e) => setQuarantineDays(parseInt(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">{t("platform_language")}</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-900">{t("default_language")}</p>
                        <p className="text-xs text-slate-500">{t("lang_desc")}</p>
                    </div>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:border-blue-600 focus:outline-none"
                    >
                        <option value="en">{t("english")}</option>
                        <option value="fr">{t("french")}</option>
                        <option value="ar">{t("arabic")}</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">{t("notifications")}</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-900">{t("email_alerts")}</p>
                        <p className="text-xs text-slate-500">{t("email_alerts_desc")}</p>
                    </div>
                    <button onClick={() => setEmailNotifs(!emailNotifs)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${emailNotifs ? 'bg-blue-600' : 'bg-slate-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${emailNotifs ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} className="px-6 py-2.5 bg-[#00205B] text-white font-semibold rounded-lg hover:bg-[#001a4a] transition shadow-sm">
                    {t("save_changes")}
                </button>
            </div>
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
    const { t } = useLanguage();
    return (
        <aside className="flex w-20 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="flex-1 overflow-y-auto py-2">
                {GASES.map((gas) => {
                    const Icon = gas.icon; const active = selected === gas.id;
                    return (<button key={gas.id} onClick={() => onSelect(gas.id)} className={`flex w-full flex-col items-center gap-1 px-1 py-3 text-[10px] font-semibold transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}><Icon size={20} strokeWidth={active ? 2.5 : 2} /><span className="leading-tight">{gas.name === "All" ? t("all") : gas.name}</span></button>);
                })}
            </div>
        </aside>
    );
}

function PartySidebar({ gasId, party, onParty, onOpenCalendar }: { gasId: string; party: string; onParty: (p: string) => void; onOpenCalendar: () => void }) {
    const { t } = useLanguage();
    const gas = GASES.find((g) => g.id === gasId) || GASES[0];
    const user = JSON.parse(localStorage.getItem("user") || '{"role": "admin"}');
    return (
        <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
            <div className="flex h-16 items-center justify-center border-b border-slate-200"><img src="/air-liquide.png" alt="Air Liquide Logo" className="h-10 w-auto" /></div>
            <div className="px-4 pt-4"><div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("selected_gas")}</div><div className="mt-1 text-sm font-bold text-slate-900">{gas.fullName}</div></div>
            <nav className="flex-1 space-y-1 p-3">
                <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t("workflow")}</div>
                {gas.steps.map((step) => {
                    const StepIcon = STEP_ICON[step] || Box; const active = party === step;
                    return (<button key={step} onClick={() => onParty(step)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:shadow-sm"}`}><StepIcon size={18} strokeWidth={2} />{t(step.toLowerCase().replace(" ", "_"))}</button>);
                })}
                {user.role === "admin" && (
                    <>
                        <div className="my-3 border-t border-slate-200" />
                        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t("pages")}</div>
                        {globalNav.map((item) => {
                            const Icon = item.icon; const active = party === item.label;
                            return (<button key={item.label} onClick={() => { if (item.label === "System Calendar") onOpenCalendar(); else onParty(item.label); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:shadow-sm"}`}><Icon size={18} strokeWidth={2} />{t(item.label.toLowerCase())}</button>);
                        })}
                    </>
                )}
            </nav>
            <div className="mx-3 mb-4 rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600"><HardHat size={20} /></div><div><div className="text-xs font-bold text-slate-900">{t("safety_priority")}</div><div className="mt-0.5 text-[10px] leading-snug text-slate-500">{t("safety_subtitle")}</div></div></div></div>
        </aside>
    );
}

function Topbar({ onOpenCalendar }: { onOpenCalendar: () => void }) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const user = JSON.parse(localStorage.getItem("user") || '{"fullName": "Maroua Guesmi", "role": "admin"}');

    const parties = [
        { label: t("admin_dashboard"), role: "admin", icon: LayoutDashboard, path: "/dashboard/admin" },
        { label: t("logistics"), role: "logistics", icon: Package, path: "/dashboard/logistics" },
        { label: t("laboratory"), role: "laboratory", icon: FlaskConical, path: "/dashboard/laboratory" },
        { label: t("production"), role: "production", icon: Cog, path: "/dashboard/production" },
        { label: t("distribution"), role: "distribution", icon: Truck, path: "/dashboard/distribution" },
    ];

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
                <h1 className="text-[26px] font-bold leading-none text-slate-900">{t("dashboard")}</h1>
                <p className="mt-1.5 text-sm text-slate-500">{t("overview_today")}</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t("search_placeholder")}
                        className="h-10 w-[320px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <button
                    onClick={onOpenCalendar}
                    className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <Calendar size={16} className="text-blue-600" />
                    {t("system_calendar")}
                </button>

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
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("switch_department")}</p>
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
                                                {t("current")}
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
                                    <span className="font-medium">{t("log_out")}</span>
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
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const [selectedGas, setSelectedGas] = useState("all");
    const [selectedParty, setSelectedParty] = useState("Dashboard");
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        { label: t("rm_received"), value: batches.filter(b => b.party === "logistics" && b.type === "RM").length, delta: 20, up: true, icon: Box, bg: "bg-blue-50", color: "text-blue-600", trendColor: "text-emerald-600" },
        { label: t("rm_quarantine"), value: batches.filter(b => b.party === "rm_lab" && b.type === "RM").length, delta: 33, up: true, icon: FlaskConical, bg: "bg-amber-50", color: "text-amber-500", trendColor: "text-amber-600" },
        { label: t("rm_approved"), value: batches.filter(b => b.party === "production" && b.type === "RM").length, delta: 12, up: true, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600", trendColor: "text-emerald-600" },
        { label: t("fp_quarantine"), value: batches.filter(b => b.party === "fp_lab" && b.type === "FP").length, delta: 16, up: true, icon: FlaskConical, bg: "bg-purple-50", color: "text-purple-600", trendColor: "text-purple-600" },
        { label: t("ready_shipping"), value: batches.filter(b => b.party === "distribution" && b.type === "FP").length, delta: 10, up: false, icon: Truck, bg: "bg-cyan-50", color: "text-cyan-600", trendColor: "text-red-500" },
        { label: t("o2_citerne_process"), value: batches.filter(b => b.type === "CITERNE" && b.status !== "approved" && b.status !== "ready").length, delta: 5, up: true, icon: Warehouse, bg: "bg-orange-50", color: "text-orange-600", trendColor: "text-emerald-600" },
        { label: t("rejected_batches"), value: batches.filter(b => b.status === "rejected").length, delta: 50, up: false, icon: X, bg: "bg-red-50", color: "text-red-500", trendColor: "text-red-500" },
    ], [batches, t]);

    const flowSteps = useMemo(() => [
        { label: t("rm_received_step"), icon: Box, count: batches.filter(b => b.party === "logistics" && b.type === "RM").length, tint: "bg-blue-50 text-blue-600" },
        { label: t("rm_quarantine_step"), icon: FlaskConical, count: batches.filter(b => b.party === "rm_lab").length, tint: "bg-amber-50 text-amber-500" },
        { label: t("in_production"), icon: Cog, count: batches.filter(b => b.party === "production").length, tint: "bg-purple-50 text-purple-600" },
        { label: t("fp_quarantine_step"), icon: FlaskConical, count: batches.filter(b => b.party === "fp_lab").length, tint: "bg-cyan-50 text-cyan-600" },
        { label: t("ready_to_ship_step"), icon: Warehouse, count: batches.filter(b => b.party === "distribution" && b.status !== "delivered").length, tint: "bg-emerald-50 text-emerald-600" },
        { label: t("delivered"), icon: Truck, count: batches.filter(b => b.status === "delivered").length, tint: "bg-slate-100 text-slate-600" },
    ], [batches, t]);

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
            if (h.action.includes("Created")) { badge = t("logistics"); badgeClass = "bg-indigo-50 text-indigo-700"; dot = "bg-indigo-500"; }
            else if (h.action.includes("Lab")) { badge = t("laboratory"); badgeClass = "bg-amber-50 text-amber-700"; dot = "bg-amber-500"; }
            else if (h.action.includes("Production")) { badge = t("production"); badgeClass = "bg-blue-50 text-blue-700"; dot = "bg-blue-500"; }
            else if (h.action.includes("Rejected")) { badge = t("rejected"); badgeClass = "bg-red-50 text-red-700"; dot = "bg-red-500"; }
            else if (h.action.includes("Moved")) { badge = t("moved"); badgeClass = "bg-emerald-50 text-emerald-700"; dot = "bg-emerald-500"; }
            return { time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: `Batch ${h.lotId} (${h.gasId}): ${h.action}`, badge, badgeClass, dot };
        });
    }, [batches, t]);

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
        return [
            { name: t("completed"), value: statusCounts.Completed, color: "#10b981" },
            { name: t("in_progress"), value: statusCounts["In Progress"], color: "#3b82f6" },
            { name: t("pending"), value: statusCounts.Pending, color: "#f59e0b" },
            { name: t("rejected"), value: statusCounts.Rejected, color: "#ef4444" }
        ].filter(s => s.value > 0);
    }, [batches, t]);

    const totalBatch = batchStatus.reduce((s, b) => s + b.value, 0);
    const completedBatches = batchStatus.find(s => s.name === t("completed"))?.value || 0;
    const progressPercent = totalBatch > 0 ? Math.round((completedBatches / totalBatch) * 100) : 0;

    if (isLoading) {
        return (<div className="flex h-screen items-center justify-center bg-[#f8fafc]"><div className="flex flex-col items-center gap-3 text-slate-500"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div><span className="text-sm font-medium">{t("loading_dashboard")}</span></div></div>);
    }

    return (
        <div className="flex h-screen bg-[#f8fafc]" dir={lang === "ar" ? "rtl" : "ltr"}>
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
                    {selectedParty === "Users" && <UsersView />}
                    {selectedParty === "Settings" && <SettingsView />}

                    {selectedParty === "Dashboard" && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">{kpis.map((k, i) => <KpiCard key={i} kpi={k} />)}</div>
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="mb-6 text-base font-semibold text-slate-900">{t("production_flow")}</h2>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        {flowSteps.map((step, i) => {
                                            const Icon = step.icon;
                                            return (<React.Fragment key={step.label}><div className="flex flex-col items-center text-center flex-1 min-w-[80px]"><div className={`grid h-12 w-12 place-items-center rounded-full ${step.tint}`}><Icon size={20} strokeWidth={2} /></div><div className="mt-2 max-w-[88px] whitespace-pre-line text-[11.5px] font-medium leading-tight text-slate-600">{step.label}</div><div className="mt-1 text-xl font-bold text-slate-900">{step.count}</div></div>{i < flowSteps.length - 1 && <ArrowRight size={16} className="hidden lg:block shrink-0 text-slate-300" />}</React.Fragment>);
                                        })}
                                    </div>
                                    <div className="mt-8"><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium text-slate-700">{t("overall_progress")}</span><span className="font-semibold text-blue-600">{progressPercent}%</span></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPercent}%` }} /></div></div>
                                </div>
                                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">{t("recent_activity")}</h2><button className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50">{t("view_all")}</button></div>
                                    <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[320px]">
                                        {activities.length === 0 ? (<li className="py-8 text-sm text-slate-500 text-center">{t("no_recent_activity")}</li>) : (
                                            activities.map((a, i) => (<li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${a.dot}`} /><span className="w-[52px] shrink-0 text-xs font-medium text-slate-500">{a.time}</span><span className="flex-1 text-sm leading-snug text-slate-700 truncate" title={a.text}>{a.text}</span><span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${a.badgeClass}`}>{a.badge}</span></li>))
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-4 flex items-baseline gap-2"><h2 className="text-base font-semibold text-slate-900">{selectedGas === "all" ? t("top_materials") : t("top_suppliers")}</h2><span className="text-xs text-slate-400">({t("this_month")})</span></div>
                                    <div className="flex items-center gap-5">
                                        <div className="relative h-[180px] w-[180px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={topMaterials} innerRadius={58} outerRadius={85} paddingAngle={2} dataKey="kg" stroke="none">{topMaterials.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div>
                                        <div className="flex-1"><ul className="divide-y divide-slate-100">{topMaterials.map((m) => (<li key={m.name} className="grid grid-cols-[1fr_auto] items-center gap-x-4 py-1.5 text-sm"><span className="flex items-center gap-2 text-slate-700"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />{m.name}</span><span className="font-semibold text-slate-900">{m.kg.toLocaleString()}</span></li>))}</ul><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm font-semibold text-slate-700">{t("total")}</span><span className="text-sm font-bold text-slate-900">{totalMat.toLocaleString()} kg</span></div></div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-3 flex items-baseline gap-2"><h2 className="text-base font-semibold text-slate-900">{t("weekly_overview")}</h2><span className="text-xs text-slate-400">({t("last_7_days")})</span></div>
                                    <div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={productionSeries} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" /><XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 4 }} /><Line type="monotone" dataKey="received" name={t("received")} stroke="#93bbfd" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: "#93bbfd" }} /><Line type="monotone" dataKey="completed" name={t("completed")} stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#2563eb" }} /></LineChart></ResponsiveContainer></div>
                                </div>
                                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h2 className="mb-2 text-base font-semibold text-slate-900">{t("batch_status")}</h2>
                                    <div className="flex items-center gap-5">
                                        <div className="relative h-[160px] w-[160px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={batchStatus} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">{batchStatus.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div>
                                        <div className="flex-1"><div className="mb-3 flex items-baseline justify-between"><span className="text-xs text-slate-500">{t("total_batches")}</span><span className="text-2xl font-bold text-slate-900">{totalBatch}</span></div><ul className="space-y-2.5">{batchStatus.map((b) => (<li key={b.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-slate-700"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />{b.name}</span><span className="text-slate-500"><span className="font-semibold text-slate-900">{b.value}</span> ({totalBatch > 0 ? ((b.value / totalBatch) * 100).toFixed(1) : 0}%)</span></li>))}</ul></div>
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