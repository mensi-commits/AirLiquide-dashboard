import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Cog, Search, Bell, ArrowRight, CheckCircle2, Factory, Users, FileText, FlaskConical, Package, Droplets
} from "lucide-react";

export default function ProductionDashboard() {
    const navigate = useNavigate();
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [equipeSelections, setEquipeSelections] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        try {
            // Fetch only RM batches that have been approved by RM Lab and are waiting in production
            const res = await fetch("http://localhost:5000/api/batches?party=production", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setBatches(data);

                // Initialize equipe selections for new batches
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

    const handleEquipeChange = (lotId: string, equipe: string) => {
        setEquipeSelections(prev => ({ ...prev, [lotId]: equipe }));
    };

    const produceFPLot = async (rmBatch: any) => {
        const token = localStorage.getItem("token");
        const equipe = equipeSelections[rmBatch.lotId] || "Equipe A";

        // Generate FP Lot ID: RM Lot ID + "-01" 
        // Example: O2-26-08-04-01 becomes O2-26-08-04-01-01
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
                fetchBatches(); // Refresh list to remove the processed RM batch
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
                    <span className="text-sm font-medium">Loading production data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <img src="/air-liquide-logo.png" alt="Air Liquide Logo" className="h-14 w-14" />
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Production Dashboard</h1>
                        <p className="text-xs text-slate-500">Raw Material to Final Product Conversion</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search RM lots, gas..."
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
                            <div className="text-sm font-semibold text-slate-900">Production Team</div>
                            <div className="text-xs text-slate-500">Manufacturing Lead</div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 grid place-items-center font-bold">
                            PT
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
                                <Package className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{batches.length}</div>
                                <div className="text-xs text-slate-600 mt-0.5">RM Ready for Production</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Droplets className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">FP Lots</div>
                                <div className="text-xs text-slate-600 mt-0.5">Conditionnement</div>
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
                                <div className="text-xs text-slate-600 mt-0.5">Active Equipes</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                <FlaskConical className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">FP Lab</div>
                                <div className="text-xs text-slate-600 mt-0.5">Next Step: Quarantine</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Cog className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900">Lot Generation Logic</h3>
                        <p className="text-xs text-blue-700 mt-1">
                            A new Final Product (FP) lot is created for each production run. The FP Lot ID is generated by appending the lot sequence to the RM Lot ID (e.g., <code className="bg-blue-100 px-1 rounded">O2-26-08-04-01-01</code>).
                            Parameters: <strong>Raw Material + Day + Equipe</strong>. After production, the FP lot is automatically sent to FP Quarantine.
                        </p>
                    </div>
                </div>

                {/* Production Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">RM Lot ID</th>
                                    <th className="px-6 py-4">Gas Type</th>
                                    <th className="px-6 py-4">Quantity (kg)</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Equipe</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBatches.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No approved raw materials waiting for production.
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
                                                    <option value="Equipe A">Equipe A</option>
                                                    <option value="Equipe B">Equipe B</option>
                                                    <option value="Equipe C">Equipe C</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => produceFPLot(batch)}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
                                                >
                                                    Produce FP Lot
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
        </div>
    );
}