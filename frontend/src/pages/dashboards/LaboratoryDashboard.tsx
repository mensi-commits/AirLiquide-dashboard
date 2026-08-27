import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FlaskConical, Hourglass, CheckCircle2, XCircle, Clock, Search, Filter,
    Download, Eye, ChevronLeft, ChevronRight, Calendar, X, FileText, User,
    Beaker, Droplets, Truck, Package, Warehouse, AlertTriangle
} from "lucide-react";

export default function LaboratoryDashboard() {
    const navigate = useNavigate();
    const [samples, setSamples] = useState([]);
    const [selectedSample, setSelectedSample] = useState(null);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All Samples");

    const itemsPerPage = 10;

    useEffect(() => {
        fetchSamples();
    }, []);

    const fetchSamples = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("http://localhost:5000/api/batches", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                // Filter for batches currently in a Lab Quarantine stage or Rejected
                const labBatches = data.filter(b =>
                    ["rm_lab", "fp_lab", "citerne_lab"].includes(b.party) ||
                    b.status === "rejected"
                );
                setSamples(labBatches);
            } else if (res.status === 401) {
                localStorage.clear();
                navigate("/login");
            }
        } catch (err) {
            console.error("Failed to fetch samples", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = (sample) => {
        setSelectedSample(sample);
        setShowDetailsPanel(true);
    };

    const handleApprove = async (sample) => {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

        // 1. Submit Lab Results (Mocking Ph. Eur. standard passing results)
        await fetch(`http://localhost:5000/api/batches/${sample.lotId}/lab`, {
            method: "PATCH", headers,
            body: JSON.stringify({
                purity: 99.5 + Math.random() * 0.4,
                co: Math.random() * 3,
                co2: Math.random() * 200,
                h2o: Math.random() * 50,
            }),
        });

        // 2. Move to next party based on the type of batch
        let nextParty = "production"; // Default for RM
        if (sample.party === "fp_lab") nextParty = "distribution";
        if (sample.party === "citerne_lab") nextParty = "citerne_distribution";

        await fetch(`http://localhost:5000/api/batches/${sample.lotId}/move`, {
            method: "PATCH", headers,
            body: JSON.stringify({ nextParty, newStatus: "approved" }),
        });

        fetchSamples();
        setShowDetailsPanel(false);
    };

    const handleReject = async (sample) => {
        const token = localStorage.getItem("token");
        await fetch(`http://localhost:5000/api/batches/${sample.lotId}/reject`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        fetchSamples();
        setShowDetailsPanel(false);
    };

    const getTypeLabel = (party) => {
        if (party === "rm_lab") return "Raw Material (RM)";
        if (party === "fp_lab") return "Final Product (FP)";
        if (party === "citerne_lab") return "O₂ Citerne";
        return "Unknown";
    };

    const getTypeIcon = (party) => {
        if (party === "rm_lab") return <Package className="h-4 w-4 text-blue-600" />;
        if (party === "fp_lab") return <Droplets className="h-4 w-4 text-purple-600" />;
        if (party === "citerne_lab") return <Warehouse className="h-4 w-4 text-orange-600" />;
        return <FlaskConical className="h-4 w-4 text-slate-600" />;
    };

    const getStatusBadge = (sample) => {
        if (sample.status === "rejected") return { text: "Rejected", class: "bg-red-50 text-red-700 ring-red-200" };
        if (sample.status === "approved" || sample.status === "ready") return { text: "Conforme", class: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
        return { text: "In Quarantine", class: "bg-amber-50 text-amber-700 ring-amber-200" };
    };

    const filteredSamples = samples.filter((sample) => {
        const matchesSearch =
            sample.lotId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sample.gasId.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === "All Samples" ||
            (activeTab === "RM Quarantine" && sample.party === "rm_lab") ||
            (activeTab === "FP Quarantine" && sample.party === "fp_lab") ||
            (activeTab === "Citerne QC" && sample.party === "citerne_lab") ||
            (activeTab === "Rejected" && sample.status === "rejected");

        return matchesSearch && matchesTab;
    });

    const totalPages = Math.ceil(filteredSamples.length / itemsPerPage);
    const paginatedSamples = filteredSamples.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const kpis = {
        rmQuarantine: samples.filter(s => s.party === "rm_lab" && s.status !== "rejected").length,
        fpQuarantine: samples.filter(s => s.party === "fp_lab" && s.status !== "rejected").length,
        citerneQC: samples.filter(s => s.party === "citerne_lab" && s.status !== "rejected").length,
        rejected: samples.filter(s => s.status === "rejected").length,
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">Loading laboratory data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <img src="/air-liquide-logo.png" alt="Air Liquide Logo" className="h-14 w-14" />
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Laboratory QC</h1>
                        <p className="text-xs text-slate-500">Analyze and manage RM, FP, and Citerne quarantines</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search lot ID, gas..."
                            className="h-10 w-72 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">Lab Team</div>
                            <div className="text-xs text-slate-500">Quality Control</div>
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
                            <button className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                                <Download className="h-4 w-4" />
                                Export QC Report
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-600">RM in Quarantine</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.rmQuarantine}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <Droplets className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-600">FP in Quarantine</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.fpQuarantine}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Warehouse className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-600">O₂ Citerne QC</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.citerneQC}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-600">Rejected Batches</div>
                                    <div className="text-2xl font-bold text-slate-900 mt-0.5">{kpis.rejected}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs & Filters */}
                    <div className="bg-white rounded-xl border border-slate-200 mb-4">
                        <div className="flex items-center gap-6 px-6 border-b border-slate-200">
                            {["All Samples", "RM Quarantine", "FP Quarantine", "Citerne QC", "Rejected"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 flex items-center gap-3 flex-wrap">
                            <div className="flex-1 min-w-[260px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by lot ID, gas..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Lot ID</th>
                                        <th className="px-6 py-4">Gas Type</th>
                                        <th className="px-6 py-4">Batch Type</th>
                                        <th className="px-6 py-4">Received Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedSamples.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                                No samples found for this category.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedSamples.map((sample) => {
                                            const badge = getStatusBadge(sample);
                                            return (
                                                <tr key={sample._id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">
                                                        {sample.lotId}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-700">{sample.gasId}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            {getTypeIcon(sample.party)}
                                                            {getTypeLabel(sample.party)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {new Date(sample.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${badge.class}`}>
                                                            {badge.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {sample.status === "pending" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApprove(sample)}
                                                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
                                                                    >
                                                                        <CheckCircle2 className="h-3 w-3" /> Conforme
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(sample)}
                                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                                                                    >
                                                                        <XCircle className="h-3 w-3" /> Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                onClick={() => handleViewDetails(sample)}
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
                                Showing <span className="font-medium text-slate-700">{paginatedSamples.length}</span> of{" "}
                                <span className="font-medium text-slate-700">{filteredSamples.length}</span> entries
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

                {/* Sample Details Panel */}
                {showDetailsPanel && selectedSample && (
                    <aside className="w-96 bg-white border-l border-slate-200 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-semibold text-slate-900">QC Analysis Details</h2>
                            <button
                                onClick={() => setShowDetailsPanel(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusBadge(selectedSample).class}`}>
                                {getStatusBadge(selectedSample).text}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-xs font-medium text-slate-500 mb-1">Lot ID</div>
                                <div className="text-sm font-bold text-slate-900 font-mono">{selectedSample.lotId}</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-slate-500 mb-1">Gas Type</div>
                                <div className="text-sm font-medium text-slate-900">{selectedSample.gasId}</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-slate-500 mb-1">Batch Type</div>
                                <div className="text-sm font-medium text-slate-900">{getTypeLabel(selectedSample.party)}</div>
                            </div>
                            {selectedSample.equipe && (
                                <div>
                                    <div className="text-xs font-medium text-slate-500 mb-1">Production Equipe</div>
                                    <div className="text-sm font-medium text-slate-900">{selectedSample.equipe}</div>
                                </div>
                            )}
                            {selectedSample.citerneType && (
                                <div>
                                    <div className="text-xs font-medium text-slate-500 mb-1">Citerne Type</div>
                                    <div className="text-sm font-medium text-slate-900">{selectedSample.citerneType}</div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-200">
                                <div className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                    Required Analysis Limits (Ph. Eur.)
                                </div>
                                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-700">Purity Assay</span>
                                        <span className="text-slate-900 font-medium">≥ 99.5%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-700">Moisture (H₂O)</span>
                                        <span className="text-slate-900 font-medium">≤ 67 ppm</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-700">Carbon Monoxide (CO)</span>
                                        <span className="text-slate-900 font-medium">≤ 5 ppm</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-700">Carbon Dioxide (CO₂)</span>
                                        <span className="text-slate-900 font-medium">≤ 300 ppm</span>
                                    </div>
                                </div>
                            </div>

                            {selectedSample.labResults && (
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="text-xs font-semibold text-slate-900 mb-3">Recorded Lab Results</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-slate-600">Purity:</span><span className="font-medium">{selectedSample.labResults.purity?.toFixed(2)}%</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-600">H₂O:</span><span className="font-medium">{selectedSample.labResults.h2o?.toFixed(1)} ppm</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-600">CO:</span><span className="font-medium">{selectedSample.labResults.co?.toFixed(1)} ppm</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-600">CO₂:</span><span className="font-medium">{selectedSample.labResults.co2?.toFixed(1)} ppm</span></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedSample.status === "pending" && (
                            <div className="mt-6 flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleApprove(selectedSample)}
                                    className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="h-4 w-4" /> Confirm (Conforme)
                                </button>
                                <button
                                    onClick={() => handleReject(selectedSample)}
                                    className="flex-1 h-10 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-2"
                                >
                                    <XCircle className="h-4 w-4" /> Reject
                                </button>
                            </div>
                        )}
                    </aside>
                )}
            </div>

            {/* Bottom User Profile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-30">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 grid place-items-center font-bold text-xs">
                        QC
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900">Quality Control Team</div>
                        <div className="text-xs text-slate-500">Laboratory Analyst</div>
                    </div>
                </div>
            </div>
        </div>
    );
}