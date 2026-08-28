import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Package, FlaskConical, CheckCircle2, Truck, Droplet, XCircle,
    Search, Filter, Plus, Upload, Eye, MoreVertical, ChevronLeft,
    ChevronRight, Calendar, X, FileText, User, Download, ArrowRight, Warehouse
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage"; // Adjust path if needed

export default function LogisticsDashboard() {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();

    // Check user role to determine if they are an admin
    const user = JSON.parse(localStorage.getItem("user") || '{"role": "logistics"}');
    const isAdmin = user.role === "admin";

    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [supplierFilter, setSupplierFilter] = useState("All Suppliers");

    // Auto-generate Lot ID based on new logic: GAZ-YY-MM-DD-SEQ or O2-YY-MM-DD-3C-SEQ
    // MOVED UP so we can use it in the initial state
    const generateLotId = (gas, isCiterne, citerneType) => {
        const date = new Date();
        const yy = String(date.getFullYear()).slice(-2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const seq = String(Math.floor(Math.random() * 90) + 10);

        if (isCiterne && gas === "O2") {
            return `${gas}-${yy}-${mm}-${dd}-${citerneType}-${seq}`;
        }
        return `${gas}-${yy}-${mm}-${dd}-${seq}`;
    };

    const [newBatch, setNewBatch] = useState({
        // FIX: Pre-fill the lotId immediately on mount
        lotId: generateLotId("O2", false, "3C"),
        gasId: "O2",
        quantity: "",
        supplier: "",
        isCiterne: false,
        citerneType: "3C"
    });

    const itemsPerPage = 10;

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("http://localhost:5000/api/batches", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setBatches(data.filter(b => b.type === "RM" || b.type === "CITERNE" || !b.type));
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

    const handleAddBatch = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        const payload = {
            lotId: newBatch.lotId,
            gasId: newBatch.gasId,
            quantity: newBatch.quantity,
            supplier: newBatch.supplier,
            type: newBatch.isCiterne ? "CITERNE" : "RM",
            party: newBatch.isCiterne ? "citerne_lab" : "logistics",
            status: newBatch.isCiterne ? "pending" : "received",
            citerneType: newBatch.isCiterne ? newBatch.citerneType : undefined
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
                // FIX: Reset with a newly generated lotId instead of an empty string
                setNewBatch({
                    lotId: generateLotId("O2", false, "3C"),
                    gasId: "O2",
                    quantity: "",
                    supplier: "",
                    isCiterne: false,
                    citerneType: "3C"
                });
                fetchBatches();
            } else {
                if (data.error && data.error.includes("E11000")) {
                    alert("A batch with this Lot ID already exists. Please generate a new one.");
                } else {
                    alert(`Failed to register material: ${data.error || "Unknown error"}`);
                }
            }
        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred. Please try again.");
        }
    };

    const sendToRMLab = async (lotId) => {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ nextParty: "rm_lab", newStatus: "pending" }),
        });
        if (res.ok) fetchBatches();
    };

    const sendToCiterne = async (lotId) => {
        const token = localStorage.getItem("token");
        const parts = lotId.split('-');
        const dateStr = parts.length >= 4 ? `${parts[1]}-${parts[2]}-${parts[3]}` : "26-08-28";
        const seq = String(Math.floor(Math.random() * 90) + 10);

        const citerneCode = `O2-${dateStr}-3C-${seq}`;

        const res = await fetch(`http://localhost:5000/api/batches/${lotId}/move`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                nextParty: "citerne_lab",
                newStatus: "pending",
                type: "CITERNE",
                citerneType: "3C",
                lotId: citerneCode
            }),
        });
        if (res.ok) fetchBatches();
    };

    const handleViewDetails = (batch) => {
        setSelectedBatch(batch);
        setShowDetailsPanel(true);
    };

    const filteredBatches = batches.filter((batch) => {
        const matchesSearch =
            batch.lotId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (batch.supplier && batch.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
            batch.gasId.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (statusFilter !== "All Status") {
            if (statusFilter === "In RM Quarantine") matchesStatus = batch.party === "rm_lab";
            else if (statusFilter === "RM Approved") matchesStatus = batch.status === "approved" || batch.party === "production";
            else matchesStatus = batch.status === statusFilter.toLowerCase();
        }

        const matchesSupplier = supplierFilter === "All Suppliers" || batch.supplier === supplierFilter;

        return matchesSearch && matchesStatus && matchesSupplier;
    });

    const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
    const paginatedBatches = filteredBatches.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const kpis = {
        totalRM: batches.filter(b => b.type === 'RM' || !b.type).length,
        inRMQuarantine: batches.filter(b => (b.type === 'RM' || !b.type) && b.party === 'rm_lab').length,
        rmApproved: batches.filter(b => (b.type === 'RM' || !b.type) && (b.status === 'approved' || b.party === 'production')).length,
        o2Citerne: batches.filter(b => b.type === 'CITERNE').length,
        rejected: batches.filter(b => b.status === 'rejected').length,
    };

    const uniqueSuppliers = [...new Set(batches.map((b) => b.supplier).filter(Boolean))];

    const getStatusBadge = (batch) => {
        if (batch.status === "rejected") return { text: t("rejected"), class: "bg-red-50 text-red-700 ring-red-200" };
        if (batch.type === "CITERNE") {
            if (batch.party === "citerne_lab") return { text: t("citerne_in_lab"), class: "bg-amber-50 text-amber-700 ring-amber-200" };
            if (batch.status === "approved") return { text: t("citerne_approved"), class: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
            return { text: t("citerne_pending"), class: "bg-blue-50 text-blue-700 ring-blue-200" };
        }
        if (batch.party === "rm_lab") return { text: t("in_rm_quarantine"), class: "bg-amber-50 text-amber-700 ring-amber-200" };
        if (batch.party === "production" || batch.status === "approved") return { text: t("rm_approved"), class: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
        return { text: t("received"), class: "bg-slate-100 text-slate-700 ring-slate-200" };
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">{t("loading_dashboard_data")}</span>
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
                        <h1 className="text-lg font-bold text-slate-900">{t("raw_materials_intake")}</h1>
                        <p className="text-xs text-slate-500">{t("manage_track_rm_citernes")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t("search_batch_material_supplier")}
                            className="h-10 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">{t("logistics_team")}</div>
                            <div className="text-xs text-slate-500">{t("intake_quarantine")}</div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 grid place-items-center font-bold">
                            L
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Main Content */}
                <main className="flex-1 p-6">
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mb-6">
                        <div></div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                {t("register_new_material")}
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{kpis.totalRM}</div>
                                    <div className="text-xs text-slate-600 mt-0.5">{t("total_rm_received")}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <FlaskConical className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{kpis.inRMQuarantine}</div>
                                    <div className="text-xs text-slate-600 mt-0.5">{t("in_rm_quarantine")}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{kpis.rmApproved}</div>
                                    <div className="text-xs text-slate-600 mt-0.5">{t("rm_approved")}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Warehouse className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{kpis.o2Citerne}</div>
                                    <div className="text-xs text-slate-600 mt-0.5">{t("o2_citerne_process")}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{kpis.rejected}</div>
                                    <div className="text-xs text-slate-600 mt-0.5">{t("rejected")}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex-1 min-w-[260px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={t("search_by_lot_material_supplier")}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-600 focus:outline-none"
                            >
                                <option value="All Status">{t("all_status")}</option>
                                <option value="received">{t("received")}</option>
                                <option value="In RM Quarantine">{t("in_rm_quarantine")}</option>
                                <option value="RM Approved">{t("rm_approved")}</option>
                                <option value="rejected">{t("rejected")}</option>
                            </select>
                            <select
                                value={supplierFilter}
                                onChange={(e) => setSupplierFilter(e.target.value)}
                                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-600 focus:outline-none"
                            >
                                <option value="All Suppliers">{t("all_suppliers")}</option>
                                {uniqueSuppliers.map((supplier) => (
                                    <option key={supplier} value={supplier}>{supplier}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">{t("lot_id_rm")}</th>
                                        <th className="px-6 py-4">{t("gas_type")}</th>
                                        <th className="px-6 py-4">{t("supplier")}</th>
                                        <th className="px-6 py-4">{t("received_date")}</th>
                                        <th className="px-6 py-4">{t("quantity")}</th>
                                        <th className="px-6 py-4">{t("status")}</th>
                                        <th className="px-6 py-4">{t("actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedBatches.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                                {t("no_samples_found")}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedBatches.map((batch) => {
                                            const badge = getStatusBadge(batch);
                                            return (
                                                <tr key={batch._id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">{batch.lotId}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-700">{batch.gasId}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{batch.supplier}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(batch.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{batch.quantity} kg</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${badge.class}`}>
                                                            {badge.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {batch.party === "logistics" && (batch.type === "RM" || !batch.type) && (
                                                                <button
                                                                    onClick={() => sendToRMLab(batch.lotId)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                                                                >
                                                                    {t("send_to_rm_lab")} <ArrowRight className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                            {batch.party === "logistics" && batch.gasId === "O2" && (batch.type === "RM" || !batch.type) && (
                                                                <button
                                                                    onClick={() => sendToCiterne(batch.lotId)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition"
                                                                >
                                                                    {t("to_citerne")} <Truck className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleViewDetails(batch)}
                                                                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                            <div className="text-sm text-slate-500">
                                {t("showing")} <span className="font-medium text-slate-700">{paginatedBatches.length}</span> {t("of")}{" "}
                                <span className="font-medium text-slate-700">{filteredBatches.length}</span> {t("entries")}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`h-8 w-8 flex items-center justify-center rounded-md text-sm font-medium ${currentPage === page ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Batch Details Panel */}
                {showDetailsPanel && selectedBatch && (
                    <aside className="w-96 bg-white border-l border-slate-200 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-semibold text-slate-900">{t("batch_details")}</h2>
                            <button onClick={() => setShowDetailsPanel(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mb-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusBadge(selectedBatch).class}`}>
                                {getStatusBadge(selectedBatch).text}
                            </span>
                        </div>
                        <div className="space-y-4">
                            <div><div className="text-xs font-medium text-slate-500 mb-1">{t("lot_id")}</div><div className="text-sm font-bold text-slate-900 font-mono">{selectedBatch.lotId}</div></div>
                            <div><div className="text-xs font-medium text-slate-500 mb-1">{t("gas_type")}</div><div className="text-sm font-medium text-slate-900">{selectedBatch.gasId}</div></div>
                            <div><div className="text-xs font-medium text-slate-500 mb-1">{t("type")}</div><div className="text-sm font-medium text-slate-900">{selectedBatch.type || "RM"}</div></div>
                            <div><div className="text-xs font-medium text-slate-500 mb-1">{t("supplier")}</div><div className="text-sm font-medium text-slate-900">{selectedBatch.supplier}</div></div>
                            <div><div className="text-xs font-medium text-slate-500 mb-1">{t("received_date")}</div><div className="text-sm font-medium text-slate-900">{new Date(selectedBatch.date).toLocaleString()}</div></div>
                            <div><div className="text-xs font-medium text-slate-500 mb-1">{t("quantity")}</div><div className="text-sm font-medium text-slate-900">{selectedBatch.quantity} kg</div></div>
                        </div>
                    </aside>
                )}
            </div>

            {/* Add Material Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900">{t("register_new_material")}</h3>
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
                                        const isCiterne = newBatch.isCiterne && gas === "O2";
                                        setNewBatch({
                                            ...newBatch,
                                            gasId: gas,
                                            isCiterne: isCiterne,
                                            lotId: generateLotId(gas, isCiterne, newBatch.citerneType)
                                        });
                                    }}
                                >
                                    <option value="O2">{t("oxygen_o2")}</option>
                                    <option value="N2">{t("nitrogen_n2")}</option>
                                    <option value="CO2">{t("carbon_dioxide_co2")}</option>
                                    <option value="N2O">{t("nitrous_oxide_n2o")}</option>
                                    <option value="MEOPA">MEOPA</option>
                                    <option value="AIR">{t("air_respirable")}</option>
                                </select>
                            </div>

                            {newBatch.gasId === "O2" && (
                                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="isCiterne"
                                        checked={newBatch.isCiterne}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setNewBatch({
                                                ...newBatch,
                                                isCiterne: isChecked,
                                                lotId: generateLotId(newBatch.gasId, isChecked, newBatch.citerneType)
                                            });
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isCiterne" className="text-sm font-medium text-amber-800">
                                        {t("route_directly_to_o2_citerne")}
                                    </label>
                                </div>
                            )}

                            {newBatch.isCiterne && newBatch.gasId === "O2" && (
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("citerne_type")}</label>
                                    <select
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none"
                                        value={newBatch.citerneType}
                                        onChange={(e) => setNewBatch({
                                            ...newBatch,
                                            citerneType: e.target.value,
                                            lotId: generateLotId(newBatch.gasId, true, e.target.value)
                                        })}
                                    >
                                        <option value="3C">3C</option>
                                        <option value="4C">4C</option>
                                        <option value="7C">7C</option>
                                    </select>
                                </div>
                            )}

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

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("supplier")}</label>
                                <input
                                    required
                                    type="text"
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none"
                                    value={newBatch.supplier}
                                    onChange={(e) => setNewBatch({ ...newBatch, supplier: e.target.value })}
                                    placeholder={t("eg_air_liquide_group")}
                                />
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