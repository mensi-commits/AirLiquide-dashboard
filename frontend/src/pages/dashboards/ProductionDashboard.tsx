import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Cog, Search, Bell, ArrowRight, CheckCircle2, Factory, Users, FileText, FlaskConical, Package, Droplets, Plus, X
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage"; // Adjust path if needed

export default function ProductionDashboard() {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();

    // Check user role to determine if they are an admin
    const user = JSON.parse(localStorage.getItem("user") || '{"role": "production"}');
    const isAdmin = user.role === "admin";

    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [equipeSelections, setEquipeSelections] = useState<Record<string, string>>({});

    // New states for adding MEOPA/AIR directly
    const [showAddModal, setShowAddModal] = useState(false);

    // Auto-generate Lot ID based on logic: GAZ-YY-MM-DD-SEQ
    // MOVED UP so we can use it in the initial state
    const generateLotId = (gas: string) => {
        const date = new Date();
        const yy = String(date.getFullYear()).slice(-2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const seq = String(Math.floor(Math.random() * 90) + 10);
        return `${gas}-${yy}-${mm}-${dd}-${seq}`;
    };

    const [newBatch, setNewBatch] = useState({
        // FIX: Pre-fill the lotId immediately on mount
        lotId: generateLotId("MEOPA"),
        gasId: "MEOPA",
        quantity: "",
        equipe: "Equipe A"
    });

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("http://localhost:5000/api/batches?party=production", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setBatches(data);

                const selections: Record<string, string> = { ...equipeSelections };
                data.forEach((b: any) => {
                    if (!selections[b.lotId]) {
                        selections[b.lotId] = "Equipe A";
                    }
                });
                setEquipeSelections(selections);
            } else if (res.status === 401) {
                localStorage.clear();
                navigate("/login");
            }
        } catch (err) {
            console.error("Failed to fetch batches", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        // Use the lotId from state (which is either pre-generated or manually edited by admin)
        const lotId = newBatch.lotId || generateLotId(newBatch.gasId);

        const payload = {
            lotId,
            gasId: newBatch.gasId,
            quantity: newBatch.quantity,
            type: "FP",
            party: "fp_lab", // Goes directly to FP Lab for quarantine/testing
            status: "pending",
            equipe: newBatch.equipe,
            supplier: "Internal Production"
        };

        try {
            const res = await fetch("http://localhost:5000/api/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                setShowAddModal(false);
                // FIX: Reset with a newly generated lotId instead of losing it
                setNewBatch({
                    lotId: generateLotId("MEOPA"),
                    gasId: "MEOPA",
                    quantity: "",
                    equipe: "Equipe A"
                });
                alert("Batch created successfully and sent to FP Lab!");
                fetchBatches();
            } else {
                if (data.error && data.error.includes("E11000")) {
                    alert("A batch with this Lot ID already exists.");
                } else {
                    alert(`Failed to register batch: ${data.error || "Unknown error"}`);
                }
            }
        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    const handleEquipeChange = (lotId: string, equipe: string) => {
        setEquipeSelections(prev => ({ ...prev, [lotId]: equipe }));
    };

    const produceFPLot = async (rmBatch: any) => {
        const token = localStorage.getItem("token");
        const equipe = equipeSelections[rmBatch.lotId] || "Equipe A";
        const fpLotId = `${rmBatch.lotId}-01`;

        try {
            const res = await fetch("http://localhost:5000/api/batches/produce", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    rmLotId: rmBatch.lotId,
                    fpLotId: fpLotId,
                    gasId: rmBatch.gasId,
                    equipe: equipe,
                    quantity: rmBatch.quantity
                }),
            });

            if (res.ok) {
                fetchBatches();
            } else {
                console.error("Failed to produce FP lot");
            }
        } catch (err) {
            console.error("Error producing FP lot", err);
        }
    };

    const filteredBatches = batches.filter(batch =>
        batch.lotId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.gasId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <span className="text-sm font-medium">{t("loading_production_data")}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50" dir={lang === "ar" ? "rtl" : "ltr"}>
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <img src="/air-liquide-logo.png" alt="Air Liquide Logo" className="h-14 w-14" />
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">{t("production_dashboard")}</h1>
                        <p className="text-xs text-slate-500">{t("rm_to_fp_conversion")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t("search_rm_lots_gas")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                    </div>
                    <button className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                        <Bell className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">{t("production_team")}</div>
                            <div className="text-xs text-slate-500">{t("manufacturing_lead")}</div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 grid place-items-center font-bold">
                            PT
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-6">
                    <div></div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            {t("add_meopa_air_batch")}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{batches.length}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{t("rm_ready_for_production")}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Droplets className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{t("fp_lots")}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{t("conditionnement")}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">3</div>
                                <div className="text-xs text-slate-600 mt-0.5">{t("active_equipes")}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                <FlaskConical className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{t("fp_lab")}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{t("next_step_quarantine")}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Cog className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900">{t("lot_generation_logic")}</h3>
                        <p className="text-xs text-blue-700 mt-1">
                            {t("lot_generation_logic_desc")}
                        </p>
                    </div>
                </div>

                {/* Production Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">{t("rm_lot_id")}</th>
                                    <th className="px-6 py-4">{t("gas_type")}</th>
                                    <th className="px-6 py-4">{t("quantity_kg")}</th>
                                    <th className="px-6 py-4">{t("date")}</th>
                                    <th className="px-6 py-4">{t("equipe")}</th>
                                    <th className="px-6 py-4 text-right">{t("action")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBatches.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            {t("no_approved_rm_waiting")}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBatches.map((batch) => (
                                        <tr key={batch._id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900">{batch.lotId}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold">
                                                    {batch.gasId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{batch.quantity}</td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {new Date(batch.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={equipeSelections[batch.lotId] || "Equipe A"}
                                                    onChange={(e) => handleEquipeChange(batch.lotId, e.target.value)}
                                                    className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-600 focus:outline-none"
                                                >
                                                    <option value="Equipe A">{t("equipe_a")}</option>
                                                    <option value="Equipe B">{t("equipe_b")}</option>
                                                    <option value="Equipe C">{t("equipe_c")}</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => produceFPLot(batch)}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                                                >
                                                    {t("produce_fp_lot")}
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Add MEOPA/AIR Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900">{t("add_meopa_air_batch")}</h3>
                            <button onClick={() => setShowAddModal(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleAddBatch} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("material_type_gas")}</label>
                                <select
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none"
                                    value={newBatch.gasId}
                                    onChange={(e) => {
                                        const gas = e.target.value;
                                        setNewBatch({
                                            ...newBatch,
                                            gasId: gas,
                                            // Regenerate lotId when gas changes
                                            lotId: generateLotId(gas)
                                        });
                                    }}
                                >
                                    <option value="MEOPA">MEOPA</option>
                                    <option value="AIR">{t("air_respirable")}</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("equipe")}</label>
                                <select
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none"
                                    value={newBatch.equipe}
                                    onChange={(e) => setNewBatch({ ...newBatch, equipe: e.target.value })}
                                >
                                    <option value="Equipe A">{t("equipe_a")}</option>
                                    <option value="Equipe B">{t("equipe_b")}</option>
                                    <option value="Equipe C">{t("equipe_c")}</option>
                                </select>
                            </div>

                            {/* UPDATED: Lot ID Input with Admin-only editing */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("batch_lot_no")}</label>
                                <input
                                    required
                                    type="text"
                                    disabled={!isAdmin}
                                    className={`h-10 w-full rounded-lg border px-3 text-sm focus:outline-none font-mono ${isAdmin
                                        ? "border-slate-200 bg-white focus:border-blue-600"
                                        : "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                                        }`}
                                    value={newBatch.lotId}
                                    onChange={(e) => setNewBatch({ ...newBatch, lotId: e.target.value })}
                                    placeholder={t("eg_o2_26_08_04_01")}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {isAdmin ? t("format_gaz_yy_mm_dd_seq") : "Auto-generated (Admin can edit)"}
                                </p>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("quantity_kg")}</label>
                                <input
                                    required
                                    type="text"
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none"
                                    value={newBatch.quantity}
                                    onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
                                    placeholder={t("eg_1250")}
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                                <p>{t("direct_to_fp_lab_notice")}</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    {t("cancel")}
                                </button>
                                <button type="submit" className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                                    {t("register_material")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}