import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Truck, Search, Bell, CheckCircle2, Users, Package, Droplets, Warehouse, ArrowRight
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage"; // Adjust path if needed

export default function DistributionDashboard() {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        try {
            // Fetch all batches and filter for distribution phases
            const res = await fetch("http://localhost:5000/api/batches", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                // Filter for FP ready for distribution and Citerne ready for distribution
                const distBatches = data.filter((b: any) =>
                    (b.party === "distribution" && b.type === "FP") ||
                    (b.party === "citerne_distribution" && b.type === "CITERNE")
                );
                setBatches(distBatches);
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

    const dispatchBatch = async (lotId: string) => {
        const token = localStorage.getItem("token");
        // Update batch status to delivered using the /move endpoint
        await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ newStatus: "delivered" }),
        });
        fetchBatches();
    };

    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.lotId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            batch.gasId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "All" ||
            (activeTab === "FP" && batch.type === "FP") ||
            (activeTab === "Citerne" && batch.type === "CITERNE");
        return matchesSearch && matchesTab;
    });

    const kpis = {
        fpReady: batches.filter(b => b.type === "FP" && b.status !== "delivered").length,
        citerneReady: batches.filter(b => b.type === "CITERNE" && b.status !== "delivered").length,
        totalBottles: batches.filter(b => b.type === "FP").reduce((sum, b) => sum + parseInt(b.quantity || "0"), 0),
        totalCiterneKg: batches.filter(b => b.type === "CITERNE").reduce((sum, b) => sum + parseInt(b.quantity || "0"), 0),
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <span className="text-sm font-medium">{t("loading_distribution_data")}</span>
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
                        <h1 className="text-lg font-bold text-slate-900">{t("distribution_shipping")}</h1>
                        <p className="text-xs text-slate-500">{t("final_products_o2_citerne_dispatch")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t("search_lot_id_gas")}
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
                            <div className="text-sm font-semibold text-slate-900">{t("distribution_team")}</div>
                            <div className="text-xs text-slate-500">{t("logistics_manager")}</div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 grid place-items-center font-bold">
                            DT
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <Droplets className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{kpis.fpReady}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{t("fp_ready_to_ship")}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                <Warehouse className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{kpis.citerneReady}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{t("citerne_ready")}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Package className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{kpis.totalBottles}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{t("total_bottles_fp")}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{kpis.totalCiterneKg}</div>
                                <div className="text-xs text-slate-600 mt-0.5">{t("total_citerne_kg")}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-slate-200 mb-4">
                    <div className="flex items-center gap-6 px-6 border-b border-slate-200">
                        {[
                            { key: "All", label: t("all") },
                            { key: "FP", label: t("final_products_fp") },
                            { key: "Citerne", label: t("o2_citernes") }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Distribution Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">{t("lot_id")}</th>
                                    <th className="px-6 py-4">{t("gas_type")}</th>
                                    <th className="px-6 py-4">{t("batch_type")}</th>
                                    <th className="px-6 py-4">{t("equipe_citerne")}</th>
                                    <th className="px-6 py-4">{t("quantity")}</th>
                                    <th className="px-6 py-4">{t("status")}</th>
                                    <th className="px-6 py-4 text-right">{t("action")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBatches.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            {t("no_batches_ready_for_distribution")}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBatches.map((batch) => (
                                        <tr key={batch._id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900">{batch.lotId}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                                                    {batch.gasId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700">
                                                {batch.type === "FP" ? t("final_product") : t("o2_citerne")}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                {batch.type === "FP" ? batch.equipe : batch.citerneType}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {batch.quantity} {batch.type === "FP" ? t("bottles") : t("kg")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${batch.status === "delivered"
                                                    ? "bg-slate-100 text-slate-700"
                                                    : "bg-emerald-50 text-emerald-700"
                                                    }`}>
                                                    {batch.status === "delivered" ? t("delivered") : t("ready_to_ship")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {batch.status !== "delivered" && (
                                                    <button
                                                        onClick={() => dispatchBatch(batch.lotId)}
                                                        className="inline-flex items-center gap-2 rounded-lg bg-[#00205B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#001a4a]"
                                                    >
                                                        {t("dispatch")}
                                                        <Truck className="h-3 w-3" />
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
            </main>
        </div>
    );
}